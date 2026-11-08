/**
 * polyglot.doma – Terminbuchung für Kennenlerngespräche
 * ======================================================
 * Läuft als Google Apps Script im Workspace-Konto info@talaqa-lab.com
 * (veröffentlicht als Web-App: „Ausführen als: Ich“, „Zugriff: Jeder“).
 *
 * Ablauf
 *  1. Die Website fragt  ?a=slots  ab → freie Zeitfenster aus dem Google-Kalender.
 *  2. Der Besucher schickt eine Anfrage (POST) → das Zeitfenster wird als
 *     „⏳ Anfrage“ im Kalender reserviert, Domagoj bekommt eine Mail mit Link.
 *  3. Über den Link (?a=review) bestätigt oder lehnt Domagoj ab.
 *     Bestätigt: Termin mit Google-Meet-Link im Kalender, Bestätigungsmail an den Schüler.
 *  4. Stündlicher Auslöser: Anfragen, die nach 48 Stunden noch offen sind (oder deren
 *     Termin schon begonnen hat), werden freigegeben, der Schüler bekommt eine Mail.
 *
 * Keine Geheimnisse in diesem Code: Jede Anfrage hat einen eigenen Zufallsschlüssel,
 * der nur im Kalendereintrag und in der Mail an Domagoj steht.
 * Diese Datei liegt im Repo nur als Quelle; ausgeführt wird die Kopie in script.google.com.
 */

var CFG = {
  TZ: 'Europe/Sarajevo',        // Zeitzone von Domagoj (Buchungszeiten gelten in dieser Zone)
  DAY_START: 9 * 60,            // frühester Beginn: 09:00
  DAY_END: 21 * 60,             // spätestes Ende:   21:00
  DURATION: 30,                 // Länge Kennenlerngespräch in Minuten
  BUFFER: 10,                   // Pause vor und nach jedem Termin in Minuten
  STEP: 30,                     // Raster der Anfangszeiten (:00 und :30)
  LEAD_HOURS: 24,               // frühestens 24 Stunden im Voraus
  HORIZON_DAYS: 28,             // höchstens 4 Wochen im Voraus
  HOLD_HOURS: 48,               // so lange bleibt eine offene Anfrage reserviert
  CALENDARS: ['primary'],       // Kalender, deren belegte Zeiten zählen (weitere IDs möglich)
  BOOK_CALENDAR: 'primary',     // hier landen Anfragen und Termine
  OWNER_NAME: 'Domagoj',
  SITE: 'https://polyglotdoma.com/',
  BOOK_PATH: { de: 'termin/', en: 'en/book/', bs: 'bs/termin/', ar: 'ar/book/' },
  MAX_PENDING_PER_EMAIL: 2,
  MAX_PENDING_TOTAL: 30,
  CACHE_SECONDS: 20             // freie Zeiten werden höchstens 20 Sekunden zwischengespeichert
};

/* ============================================================
   Web-App: Eingänge
   ============================================================ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.a === 'slots') return json_(slotsResponse_());
  if (p.a === 'review') return reviewPage_(p.id, p.t);
  return json_({ ok: true, service: 'polyglot.doma termine' });
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return json_(createRequest_(data));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

/* ============================================================
   Freie Zeiten
   ============================================================ */

function slotsResponse_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('slots');
  if (hit) return JSON.parse(hit);
  var res = { ok: true, duration: CFG.DURATION, slots: computeSlots_().map(function (t) { return new Date(t).toISOString(); }) };
  cache.put('slots', JSON.stringify(res), CFG.CACHE_SECONDS);
  return res;
}

/** Liefert alle freien Anfangszeiten (Millisekunden, UTC). */
function computeSlots_() {
  var now = Date.now();
  var stepMs = CFG.STEP * 60000, durMs = CFG.DURATION * 60000, bufMs = CFG.BUFFER * 60000;
  var from = Math.ceil((now + CFG.LEAD_HOURS * 3600000) / stepMs) * stepMs;
  var to = now + CFG.HORIZON_DAYS * 86400000;
  var busy = busyTimes_(from - bufMs, to + durMs + bufMs);
  var out = [];
  for (var t = from; t + durMs <= to; t += stepMs) {
    var hm = Utilities.formatDate(new Date(t), CFG.TZ, 'H:m').split(':');
    var startMin = (+hm[0]) * 60 + (+hm[1]);
    if (startMin < CFG.DAY_START || startMin + CFG.DURATION > CFG.DAY_END) continue;
    var a = t - bufMs, b = t + durMs + bufMs, free = true;
    for (var i = 0; i < busy.length; i++) {
      if (a < busy[i][1] && b > busy[i][0]) { free = false; break; }
    }
    if (free) out.push(t);
  }
  return out;
}

/** Belegte Zeiten aus allen Kalendern in CFG.CALENDARS (inkl. offener Anfragen). */
function busyTimes_(fromMs, toMs) {
  var res = Calendar.Freebusy.query({
    timeMin: new Date(fromMs).toISOString(),
    timeMax: new Date(toMs).toISOString(),
    timeZone: 'UTC',
    items: CFG.CALENDARS.map(function (id) { return { id: id === 'primary' ? Session.getEffectiveUser().getEmail() : id }; })
  });
  var list = [];
  Object.keys(res.calendars || {}).forEach(function (id) {
    (res.calendars[id].busy || []).forEach(function (b) { list.push([Date.parse(b.start), Date.parse(b.end)]); });
  });
  return list;
}

/* ============================================================
   Anfrage anlegen
   ============================================================ */

function createRequest_(d) {
  if (d.hp) return { ok: true };                                   // Honigtopf: Bots bekommen „ok“, es passiert nichts
  var lang = ['de', 'en', 'bs', 'ar'].indexOf(d.lang) >= 0 ? d.lang : 'de';
  var name = clean_(d.name, 100), email = clean_(d.email, 200).toLowerCase();
  var msg = clean_(d.nachricht, 2000, true);
  var langs = (Array.isArray(d.lernsprachen) ? d.lernsprachen : []).map(function (x) { return clean_(x, 30); })
    .filter(function (x) { return ['Arabisch', 'Deutsch', 'Bosnisch', 'Noch unsicher'].indexOf(x) >= 0; });
  var art = ['Unterricht', 'Konversation', 'Weiß ich noch nicht'].indexOf(d.art) >= 0 ? d.art : '';
  var lernweg = ['Von Null an', 'Grundlagen der Sprache', 'Begleitung im Studium', 'Mit bosnischen Wurzeln', 'Ankommen in Bosnien', 'Weiß ich noch nicht'].indexOf(d.lernweg) >= 0 ? d.lernweg : '';
  var tz = validTz_(d.tz) ? d.tz : CFG.TZ;
  var start = Date.parse(d.start);
  if (!name) return { ok: false, error: 'name' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'email' };
  if (msg.length < 3) return { ok: false, error: 'msg' };
  if (!d.consent) return { ok: false, error: 'consent' };
  if (!start) return { ok: false, error: 'slot' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'busy' };
  try {
    var pending = pendingEvents_();
    if (pending.length >= CFG.MAX_PENDING_TOTAL) return { ok: false, error: 'full' };
    var mine = pending.filter(function (ev) { return prop_(ev, 'pdEmail') === email; });
    if (mine.length >= CFG.MAX_PENDING_PER_EMAIL) return { ok: false, error: 'limit' };
    if (computeSlots_().indexOf(start) < 0) return { ok: false, error: 'taken' };

    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var end = start + CFG.DURATION * 60000;
    var ev = Calendar.Events.insert({
      summary: '⏳ Anfrage: Kennenlerngespräch – ' + name,
      description: ownerSummary_(name, email, langs, art, lernweg, msg, lang, tz) + '\n\nNoch nicht bestätigt. Bestätigen oder ablehnen über den Link in der Mail.',
      start: { dateTime: new Date(start).toISOString(), timeZone: CFG.TZ },
      end: { dateTime: new Date(end).toISOString(), timeZone: CFG.TZ },
      colorId: '8',                                                // Grafit: noch offen
      transparency: 'opaque',
      reminders: { useDefault: false, overrides: [] },
      extendedProperties: { private: {
        pd: 'kennenlernen', pdStatus: 'pending', pdToken: token, pdCreated: String(Date.now()),
        pdName: name, pdEmail: email, pdLang: lang, pdTz: tz
      } }
    }, CFG.BOOK_CALENDAR, { sendUpdates: 'none' });
    CacheService.getScriptCache().remove('slots');
  } finally {
    lock.releaseLock();
  }

  var reviewUrl = ScriptApp.getService().getUrl() + '?a=review&id=' + encodeURIComponent(ev.id) + '&t=' + token;
  var whenOwner = fmtWhen_(start, CFG.TZ, 'de');
  sendOwnerMail_(
    'Neue Terminanfrage: ' + name + ' · ' + whenOwner,
    'Neue Anfrage für ein Kennenlerngespräch:\n\n' + whenOwner + ' (deine Zeit)\n\n' +
      ownerSummary_(name, email, langs, art, lernweg, msg, lang, tz) +
      '\n\nBestätigen oder ablehnen:\n' + reviewUrl +
      '\n\nDas Zeitfenster ist ' + CFG.HOLD_HOURS + ' Stunden für die Anfrage reserviert.',
    { replyTo: email, button: { url: reviewUrl, label: 'Anfrage ansehen' } }
  );
  var m = MAIL[lang];
  sendStudentMail_(email, lang, m.receivedSubject, fill_(m.received, { name: name, when: fmtWhen_(start, tz, lang) }));
  return { ok: true };
}

function ownerSummary_(name, email, langs, art, lernweg, msg, lang, tz) {
  return 'Name: ' + name + '\nE-Mail: ' + email +
    '\nLernsprachen: ' + (langs.length ? langs.join(', ') : '–') +
    '\nSucht: ' + (art || '–') +
    (lernweg ? '\nLernweg: ' + lernweg : '') +
    '\nWebsite-Sprache: ' + { de: 'Deutsch', en: 'Englisch', bs: 'Bosnisch', ar: 'Arabisch' }[lang] +
    '\nZeitzone: ' + tz +
    '\n\nNachricht:\n' + (msg || '–');
}

/* ============================================================
   Bestätigen / Ablehnen (Seite für Domagoj)
   ============================================================ */

function reviewPage_(id, t) {
  var ev = findRequest_(id, t);
  var tpl = HtmlService.createTemplate(REVIEW_HTML);
  tpl.id = id || ''; tpl.t = t || '';
  tpl.state = !ev ? 'missing' : prop_(ev, 'pdStatus');
  tpl.info = ev ? {
    name: prop_(ev, 'pdName'), email: prop_(ev, 'pdEmail'),
    when: fmtWhen_(Date.parse(ev.start.dateTime), CFG.TZ, 'de'),
    details: (ev.description || '').split('\n\nNoch nicht bestätigt')[0]
  } : null;
  return tpl.evaluate().setTitle('Terminanfrage – polyglot.doma')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Wird von der Prüfseite aufgerufen (google.script.run). */
function confirmRequest(id, t, note) {
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var ev = findRequest_(id, t);
    if (!ev) return { ok: false, error: 'Anfrage nicht gefunden.' };
    if (prop_(ev, 'pdStatus') !== 'pending') return { ok: false, error: 'Diese Anfrage wurde schon bearbeitet.' };
    var start = Date.parse(ev.start.dateTime);
    if (start <= Date.now()) return { ok: false, error: 'Der Termin liegt schon in der Vergangenheit.' };
    var name = prop_(ev, 'pdName'), email = prop_(ev, 'pdEmail'), lang = prop_(ev, 'pdLang') || 'de', tz = prop_(ev, 'pdTz') || CFG.TZ;
    var upd = Calendar.Events.patch({
      summary: 'Kennenlerngespräch – ' + name,
      description: (ev.description || '').split('\n\nNoch nicht bestätigt')[0] + '\n\nBestätigt am ' + fmtWhen_(Date.now(), CFG.TZ, 'de') + '.',
      colorId: '9',                                                // Heidelbeere: bestätigt
      attendees: [{ email: email, displayName: name }],
      reminders: { useDefault: true },
      conferenceData: { createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      extendedProperties: { private: confirmedProps_(ev) }
    }, CFG.BOOK_CALENDAR, ev.id, { conferenceDataVersion: 1, sendUpdates: 'none' });
    var link = meetLink_(upd);
    for (var i = 0; !link && i < 5; i++) {                          // Meet-Link wird manchmal erst nach einem Moment fertig
      Utilities.sleep(1500);
      link = meetLink_(Calendar.Events.get(CFG.BOOK_CALENDAR, ev.id));
    }
    var m = MAIL[lang];
    var whenStudent = fmtWhen_(start, tz, lang);
    sendStudentMail_(email, lang, fill_(m.confirmedSubject, { date: fmtDate_(start, tz, lang) }),
      fill_(m.confirmed, { name: name, when: whenStudent, link: link || '–', note: noteBlock_(note) }),
      { button: link ? { url: link, label: m.joinLabel } : null,
        attachments: [icsBlob_(start, start + CFG.DURATION * 60000, m.icsTitle, link)] });
    return { ok: true, link: link };
  } finally { lock.releaseLock(); }
}

/** Wird von der Prüfseite aufgerufen (google.script.run). */
function declineRequest(id, t, note) {
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var ev = findRequest_(id, t);
    if (!ev) return { ok: false, error: 'Anfrage nicht gefunden.' };
    if (prop_(ev, 'pdStatus') !== 'pending') return { ok: false, error: 'Diese Anfrage wurde schon bearbeitet.' };
    releaseRequest_(ev, 'declined', note);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/* ============================================================
   Offene Anfragen automatisch freigeben (stündlicher Auslöser)
   ============================================================ */

function expirePending() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) return;
  try {
    var now = Date.now();
    pendingEvents_().forEach(function (ev) {
      var created = +prop_(ev, 'pdCreated') || 0;
      var start = Date.parse(ev.start.dateTime);
      if (now - created >= CFG.HOLD_HOURS * 3600000 || start <= now) releaseRequest_(ev, 'expired');
    });
  } finally { lock.releaseLock(); }
}

function releaseRequest_(ev, why, note) {
  var name = prop_(ev, 'pdName'), email = prop_(ev, 'pdEmail'), lang = prop_(ev, 'pdLang') || 'de', tz = prop_(ev, 'pdTz') || CFG.TZ;
  var start = Date.parse(ev.start.dateTime);
  Calendar.Events.remove(CFG.BOOK_CALENDAR, ev.id, { sendUpdates: 'none' });
  CacheService.getScriptCache().remove('slots');
  var m = MAIL[lang];
  var site = CFG.SITE + CFG.BOOK_PATH[lang];
  var body = fill_(why === 'expired' ? m.expired : m.declined, { name: name, when: fmtWhen_(start, tz, lang), site: site, note: noteBlock_(note) });
  sendStudentMail_(email, lang, m.releasedSubject, body, { button: { url: site, label: m.rebookLabel } });
  if (why === 'expired') {
    sendOwnerMail_('Anfrage automatisch freigegeben: ' + name,
      'Die Anfrage von ' + name + ' (' + email + ') für ' + fmtWhen_(start, CFG.TZ, 'de') +
      ' war ' + CFG.HOLD_HOURS + ' Stunden offen oder der Termin hatte schon begonnen. Das Zeitfenster ist wieder frei, ' + name + ' hat eine freundliche Mail bekommen.', { replyTo: email });
  }
}

/* ============================================================
   Einmalig ausführen: richtet den stündlichen Auslöser ein
   ============================================================ */

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'expirePending') ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('expirePending').timeBased().everyHours(1).create();
  console.log('Fertig. Freie Zeitfenster in den nächsten Tagen: ' + computeSlots_().length);
}

/* ============================================================
   Hilfsfunktionen
   ============================================================ */

function pendingEvents_() {
  var res = Calendar.Events.list(CFG.BOOK_CALENDAR, {
    privateExtendedProperty: 'pdStatus=pending',
    timeMin: new Date(Date.now() - 7 * 86400000).toISOString(),
    singleEvents: true, maxResults: 250, showDeleted: false
  });
  return res.items || [];
}

function findRequest_(id, t) {
  if (!id || !t) return null;
  try {
    var ev = Calendar.Events.get(CFG.BOOK_CALENDAR, id);
    if (!ev || ev.status === 'cancelled' || prop_(ev, 'pd') !== 'kennenlernen') return null;
    return safeEqual_(prop_(ev, 'pdToken'), String(t)) ? ev : null;
  } catch (err) { return null; }
}

function confirmedProps_(ev) {
  var p = JSON.parse(JSON.stringify(ev.extendedProperties.private));
  p.pdStatus = 'confirmed'; p.pdConfirmed = String(Date.now());
  return p;
}

function prop_(ev, key) {
  return (ev.extendedProperties && ev.extendedProperties.private && ev.extendedProperties.private[key]) || '';
}

function safeEqual_(a, b) {
  if (!a || a.length !== b.length) return false;
  var r = 0; for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function meetLink_(ev) {
  if (ev.hangoutLink) return ev.hangoutLink;
  var eps = (ev.conferenceData && ev.conferenceData.entryPoints) || [];
  for (var i = 0; i < eps.length; i++) if (eps[i].entryPointType === 'video') return eps[i].uri;
  return '';
}

function clean_(s, max, multiline) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (!multiline) s = s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

function validTz_(tz) {
  /* Zeitzone kommt aus dem Browser (IANA-Name, z. B. Europe/Berlin). Nur für die Anzeige in Mails. */
  return !!tz && /^[A-Za-z_]+(\/[A-Za-z0-9_+\-]+){0,2}$/.test(tz);
}

function fill_(s, vals) {
  return s.replace(/\{(\w+)\}/g, function (_, k) { return vals[k] != null ? vals[k] : ''; });
}

function noteBlock_(note) {
  note = clean_(note, 1500, true);
  return note ? note + '\n\n' : '';
}

/* ---------- Datum und Uhrzeit in der Sprache des Schülers ---------- */

var NAMES = {
  de: { d: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
        m: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'] },
  en: { d: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        m: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
  bs: { d: ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'],
        m: ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar'] },
  ar: { d: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
        m: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] }
};

function parts_(ms, tz) {
  var p = Utilities.formatDate(new Date(ms), tz, 'yyyy|M|d|u|HH|mm').split('|');
  return { y: p[0], mo: +p[1], d: +p[2], wd: +p[3], hh: p[4], mm: p[5] };
}

function arDigits_(s) { return String(s).replace(/[0-9]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'[c]; }); }

/** z. B. „Dienstag, 10. November 2026“ */
function fmtDate_(ms, tz, lang) {
  var p = parts_(ms, tz), n = NAMES[lang] || NAMES.de, wd = n.d[p.wd - 1], mo = n.m[p.mo - 1];
  if (lang === 'en') return wd + ' ' + p.d + ' ' + mo + ' ' + p.y;
  if (lang === 'bs') return wd + ', ' + p.d + '. ' + mo + ' ' + p.y + '.';
  if (lang === 'ar') return arDigits_(wd + '، ' + p.d + ' ' + mo + ' ' + p.y);
  return wd + ', ' + p.d + '. ' + mo + ' ' + p.y;
}

/** z. B. „Dienstag, 10. November 2026, 17:00–17:30 Uhr (Europe/Berlin)“ */
function fmtWhen_(ms, tz, lang) {
  var a = parts_(ms, tz), b = parts_(ms + CFG.DURATION * 60000, tz);
  var time = a.hh + ':' + a.mm + '–' + b.hh + ':' + b.mm;
  var zone = tz.replace(/_/g, ' ');
  if (lang === 'de') return fmtDate_(ms, tz, lang) + ', ' + time + ' Uhr (' + zone + ')';
  if (lang === 'bs') return fmtDate_(ms, tz, lang) + ', ' + time + ' h (' + zone + ')';
  if (lang === 'ar') return fmtDate_(ms, tz, lang) + '، الساعة ' + arDigits_(time) + ' (' + zone + ')';
  return fmtDate_(ms, tz, lang) + ', ' + time + ' (' + zone + ')';
}

/** Kalenderdatei (.ics) als Anhang der Bestätigung */
function icsBlob_(start, end, title, link) {
  function u(ms) { return Utilities.formatDate(new Date(ms), 'UTC', "yyyyMMdd'T'HHmmss'Z'"); }
  function esc(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
  var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//polyglot.doma//Termine//DE', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + Utilities.getUuid() + '@polyglotdoma.com', 'DTSTAMP:' + u(Date.now()), 'DTSTART:' + u(start), 'DTEND:' + u(end),
    'SUMMARY:' + esc(title), link ? 'LOCATION:' + esc(link) : '', link ? 'URL:' + link : '',
    'DESCRIPTION:' + esc(link || ''), 'END:VEVENT', 'END:VCALENDAR'].filter(String).join('\r\n');
  return Utilities.newBlob(ics, 'text/calendar', 'kennenlernen.ics');
}

/* ---------- Mails ---------- */

function sendStudentMail_(to, lang, subject, text, opt) {
  opt = opt || {};
  var o = { name: 'polyglot.doma', htmlBody: mailHtml_(text, lang, opt.button) };
  if (opt.attachments) o.attachments = opt.attachments;
  GmailApp.sendEmail(to, subject, text, o);
}

function sendOwnerMail_(subject, text, opt) {
  opt = opt || {};
  var o = { name: 'polyglot.doma Termine', htmlBody: mailHtml_(text, 'de', opt.button) };
  if (opt.replyTo) o.replyTo = opt.replyTo;
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, text, o);
}

function mailHtml_(text, lang, button) {
  var rtl = lang === 'ar';
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var body = esc(text).split('\n\n').map(function (para) {
    return '<p style="margin:0 0 16px">' + para.replace(/\n/g, '<br>').replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1D3A9A;font-weight:700">$1</a>') + '</p>';
  }).join('');
  var btn = button ? '<p style="margin:8px 0 24px"><a href="' + esc(button.url) + '" style="display:inline-block;background:#B88A4A;color:#0E1B4D;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 26px">' + esc(button.label) + '</a></p>' : '';
  return '<div dir="' + (rtl ? 'rtl' : 'ltr') + '" style="background:#F4F6FB;padding:32px 16px;font-family:' + (rtl ? 'Tahoma,Arial' : 'Helvetica,Arial') + ',sans-serif;color:#0E1B4D">' +
    '<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:28px;padding:32px;font-size:16px;line-height:1.6;text-align:' + (rtl ? 'right' : 'left') + '">' +
    '<div dir="ltr" style="font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#1D3A9A;margin-bottom:24px;text-align:' + (rtl ? 'right' : 'left') + '">polyglot<span style="color:#B88A4A">.</span><span style="font-weight:400">doma</span></div>' +
    body + btn + '</div></div>';
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   Texte der Mails an Schüler (Freigabe der Übersetzungen ausstehend)
   ============================================================ */

var MAIL = {
  de: {
    receivedSubject: 'Deine Anfrage für ein Kennenlerngespräch',
    received: 'Hallo {name},\n\ndanke für deine Anfrage! Du hast dir diesen Termin ausgesucht:\n\n{when}\n\nIch schaue mir deine Anfrage an und bestätige den Termin persönlich, spätestens innerhalb von zwei Tagen. Bis dahin ist das Zeitfenster für dich reserviert. Mit der Bestätigung bekommst du auch den Link zum Gespräch.\n\nBis bald\nDomagoj',
    confirmedSubject: 'Bestätigt: dein Kennenlerngespräch am {date}',
    confirmed: 'Hallo {name},\n\nich freue mich, dein Termin steht:\n\n{when}\n\nWir sprechen über Google Meet. Hier ist dein Link:\n{link}\n\n{note}Im Anhang findest du den Termin für deinen Kalender. Falls dir etwas dazwischenkommt, antworte einfach auf diese Mail.\n\nBis bald\nDomagoj',
    joinLabel: 'Zum Gespräch',
    icsTitle: 'Kennenlerngespräch mit Domagoj (polyglot.doma)',
    releasedSubject: 'Dein Terminwunsch für das Kennenlerngespräch',
    declined: 'Hallo {name},\n\nleider konnte ich deinen Wunschtermin nicht bestätigen:\n\n{when}\n\n{note}Such dir gern einen anderen Termin aus:\n{site}\n\nBis bald\nDomagoj',
    expired: 'Hallo {name},\n\nleider konnte ich deine Anfrage für {when} nicht rechtzeitig bestätigen. Das tut mir leid! Das Zeitfenster ist jetzt wieder freigegeben.\n\nSuch dir gern einen neuen Termin aus:\n{site}\n\nBis bald\nDomagoj',
    rebookLabel: 'Neuen Termin wählen'
  },
  en: {
    receivedSubject: 'Your request for an intro call',
    received: 'Hi {name},\n\nThank you for your request! You chose this time:\n\n{when}\n\nI’ll look at your request and confirm the appointment personally within two days at the latest. Until then, the slot is reserved for you. Once it’s confirmed, you’ll also get the link to the call.\n\nSee you soon\nDomagoj',
    confirmedSubject: 'Confirmed: your intro call on {date}',
    confirmed: 'Hi {name},\n\nGreat news, your appointment is confirmed:\n\n{when}\n\nWe’ll talk on Google Meet. Here’s your link:\n{link}\n\n{note}You’ll find the appointment for your calendar attached. If anything comes up, just reply to this email.\n\nSee you soon\nDomagoj',
    joinLabel: 'Join the call',
    icsTitle: 'Intro call with Domagoj (polyglot.doma)',
    releasedSubject: 'Your requested time for the intro call',
    declined: 'Hi {name},\n\nUnfortunately, I wasn’t able to confirm your requested time:\n\n{when}\n\n{note}Feel free to choose another time:\n{site}\n\nSee you soon\nDomagoj',
    expired: 'Hi {name},\n\nUnfortunately, I wasn’t able to confirm your request for {when} in time. I’m sorry! The slot has now been released.\n\nFeel free to choose a new time:\n{site}\n\nSee you soon\nDomagoj',
    rebookLabel: 'Choose a new time'
  },
  bs: {
    receivedSubject: 'Tvoj zahtjev za razgovor za upoznavanje',
    received: 'Zdravo {name},\n\nHvala ti na zahtjevu! Tvoj željeni termin:\n\n{when}\n\nPogledat ću tvoj zahtjev i lično potvrditi termin, najkasnije u roku od dva dana. Do tada je termin rezervisan za tebe. Uz potvrdu dobit ćeš i link za razgovor.\n\nDo uskoro\nDomagoj',
    confirmedSubject: 'Potvrđeno: tvoj razgovor za upoznavanje, {date}',
    confirmed: 'Zdravo {name},\n\nDrago mi je, tvoj termin je potvrđen:\n\n{when}\n\nRazgovaramo preko Google Meeta. Evo tvog linka:\n{link}\n\n{note}U prilogu je termin za tvoj kalendar. Ako ti nešto iskrsne, samo odgovori na ovaj mail.\n\nDo uskoro\nDomagoj',
    joinLabel: 'Pridruži se razgovoru',
    icsTitle: 'Razgovor za upoznavanje s Domagojem (polyglot.doma)',
    releasedSubject: 'Tvoj željeni termin za razgovor za upoznavanje',
    declined: 'Zdravo {name},\n\nNažalost, nisam mogao potvrditi tvoj željeni termin:\n\n{when}\n\n{note}Slobodno izaberi neki drugi termin:\n{site}\n\nDo uskoro\nDomagoj',
    expired: 'Zdravo {name},\n\nNažalost, nisam stigao na vrijeme potvrditi tvoj zahtjev za {when}. Žao mi je! Termin je sada ponovo slobodan.\n\nSlobodno izaberi novi termin:\n{site}\n\nDo uskoro\nDomagoj',
    rebookLabel: 'Izaberi novi termin'
  },
  ar: {
    receivedSubject: 'طلبك لمكالمة تعارف',
    received: 'مرحبًا {name}،\n\nشكرًا على طلبك! اخترت هذا الموعد:\n\n{when}\n\nسأطّلع على طلبك وأؤكّد الموعد بنفسي خلال يومين على الأكثر. حتى ذلك الحين يبقى الموعد محجوزًا لك. ومع التأكيد سيصلك أيضًا رابط المكالمة.\n\nإلى اللقاء قريبًا\nدوماغوي',
    confirmedSubject: 'تمّ التأكيد: مكالمة التعارف يوم {date}',
    confirmed: 'مرحبًا {name}،\n\nيسعدني أن أخبرك أن موعدك مؤكَّد:\n\n{when}\n\nسنتحدث عبر Google Meet. هذا رابطك:\n{link}\n\n{note}تجد في المرفق الموعد لإضافته إلى تقويمك. وإذا طرأ لك أمر، فما عليك إلا الرد على هذه الرسالة.\n\nإلى اللقاء قريبًا\nدوماغوي',
    joinLabel: 'الانضمام إلى المكالمة',
    icsTitle: 'مكالمة تعارف مع دوماغوي (polyglot.doma)',
    releasedSubject: 'موعدك المطلوب لمكالمة التعارف',
    declined: 'مرحبًا {name}،\n\nللأسف لم أتمكّن من تأكيد الموعد الذي طلبته:\n\n{when}\n\n{note}يمكنك اختيار موعد آخر:\n{site}\n\nإلى اللقاء قريبًا\nدوماغوي',
    expired: 'مرحبًا {name}،\n\nللأسف لم أتمكّن من تأكيد طلبك لموعد {when} في الوقت المناسب. أنا آسف! أصبح الموعد الآن متاحًا من جديد.\n\nيمكنك اختيار موعد جديد:\n{site}\n\nإلى اللقاء قريبًا\nدوماغوي',
    rebookLabel: 'اختر موعدًا جديدًا'
  }
};

/* ============================================================
   Prüfseite für Domagoj (HTML-Vorlage)
   ============================================================ */

var REVIEW_HTML = '<!doctype html><html lang="de"><head><meta charset="utf-8"><base target="_top">' +
'<style>body{margin:0;background:#F4F6FB;color:#0E1B4D;font-family:Helvetica,Arial,sans-serif}' +
'.c{max-width:560px;margin:32px auto;background:#fff;border-radius:28px;padding:32px;box-sizing:border-box}' +
'.wm{font-size:22px;font-weight:700;letter-spacing:-.03em;color:#1D3A9A;margin-bottom:20px}.wm b{color:#B88A4A}.wm i{font-style:normal;font-weight:400}' +
'h1{font-size:28px;letter-spacing:-.03em;margin:0 0 6px}.when{font-size:19px;font-weight:700;color:#1D3A9A;margin:0 0 20px}' +
'pre{white-space:pre-wrap;font-family:inherit;font-size:15px;line-height:1.55;background:#F4F6FB;border-radius:16px;padding:16px;margin:0 0 20px}' +
'label{display:block;font-size:14px;font-weight:700;margin-bottom:8px}textarea{width:100%;box-sizing:border-box;min-height:96px;border:1.5px solid #0E1B4D;border-radius:16px;padding:12px;font:inherit;font-size:15px}' +
'.b{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}button{flex:1 1 200px;min-height:52px;border-radius:999px;font:inherit;font-size:17px;font-weight:700;cursor:pointer}' +
'.ok{background:#B88A4A;color:#0E1B4D;border:none}.no{background:none;color:#0E1B4D;border:1.5px solid #0E1B4D}button[disabled]{opacity:.5;cursor:progress}' +
'.msg{font-size:17px;line-height:1.55}.msg a{color:#1D3A9A;font-weight:700}</style></head><body><div class="c">' +
'<div class="wm">polyglot<b>.</b><i>doma</i></div>' +
'<? if (state === "pending") { ?>' +
'<h1>Terminanfrage</h1><p class="when"><?= info.when ?></p><pre><?= info.details ?></pre>' +
'<div id="f"><label for="n">Persönliche Notiz an <?= info.name ?> (optional, steht in der Mail)</label><textarea id="n"></textarea>' +
'<div class="b"><button class="ok" id="ok">Bestätigen</button><button class="no" id="no">Ablehnen</button></div></div><p class="msg" id="r" hidden></p>' +
'<script>var id=<?!= JSON.stringify(id) ?>,t=<?!= JSON.stringify(t) ?>;' +
'function go(fn){var bs=document.querySelectorAll("button");bs.forEach(function(b){b.disabled=true});' +
'google.script.run.withSuccessHandler(function(res){var r=document.getElementById("r");r.hidden=false;' +
'if(!res.ok){r.textContent=res.error;bs.forEach(function(b){b.disabled=false});return}' +
'document.getElementById("f").hidden=true;r.innerHTML=fn==="confirmRequest"?"Bestätigt. Der Termin steht mit Meet-Link in deinem Kalender und die Bestätigung ist verschickt."+(res.link?"<br><a href=\\""+res.link+"\\">"+res.link+"</a>":""):"Abgelehnt. Das Zeitfenster ist wieder frei und die Mail ist verschickt."})' +
'.withFailureHandler(function(e){var r=document.getElementById("r");r.hidden=false;r.textContent="Fehler: "+e.message;bs.forEach(function(b){b.disabled=false})})' +
'[fn](id,t,document.getElementById("n").value)}' +
'document.getElementById("ok").onclick=function(){go("confirmRequest")};document.getElementById("no").onclick=function(){go("declineRequest")};</script>' +
'<? } else if (state === "confirmed") { ?><h1>Schon bestätigt</h1><p class="msg"><?= info.when ?>: Dieser Termin ist bereits bestätigt.</p>' +
'<? } else { ?><h1>Nicht mehr offen</h1><p class="msg">Diese Anfrage gibt es nicht mehr. Sie wurde abgelehnt, automatisch freigegeben oder der Link ist unvollständig.</p><? } ?>' +
'</div></body></html>';
