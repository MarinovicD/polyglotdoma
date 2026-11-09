/* polyglot.doma – Terminbuchung Kennenlerngespräch (/termin/)
   Freie Zeiten kommen live aus Domagojs Google-Kalender (Google Apps Script, s. _termine/).
   TERMIN_ENDPOINT: Adresse der veröffentlichten Web-App (endet auf /exec).
   Leer = Vorschau mit Testdaten (es wird nichts gebucht). Mit ?demo=1 ebenfalls Testdaten. */
var TERMIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyuZcosvtfNoGpCxzKg3gNR2o9dWL0oSKp4AB-Vl0Y3sie-gRGQLISZKeQHsXus-ZffkA/exec';

(function () {
  'use strict';
  var card = document.getElementById('pt-card');
  if (!card) return;

  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  var LOC = { de: 'de-DE', en: 'en-GB', bs: 'bs-BA', ar: 'ar-u-nu-arab' }[LANG] || 'de-DE';
  var MAIL = 'info@talaqa-lab.com';
  var TXT = {
    de: { blocked: 'Für diese E-Mail-Adresse ist eine Online-Buchung leider nicht möglich.', msg: 'Bitte schreib mir kurz etwas über dich und dein Ziel.', loading: 'Freie Termine werden geladen …', none: 'Gerade ist kein Termin frei. <a href="../#kontakt">Schreib mir einfach</a>, dann finden wir einen.', loadFail: 'Die freien Termine konnten gerade nicht geladen werden. Versuch es gleich noch einmal oder <a href="../#kontakt">schreib mir</a>.', noFree: 'kein Termin frei', name: 'Bitte gib deinen Namen an.', mail: 'Bitte gib eine gültige E-Mail-Adresse an.', consent: 'Bitte bestätige die Einwilligung zur Datenverarbeitung.', taken: 'Dieser Termin wurde gerade vergeben. Bitte wähl einen anderen.', limit: 'Du hast schon zwei offene Anfragen. Ich melde mich bald bei dir.', fail: 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib mir direkt an ', sending: 'Wird gesendet …', demo: 'Vorschau mit Testdaten – es wird nichts gebucht.' },
    en: { blocked: 'Unfortunately, online booking isn’t possible for this email address.', msg: 'Please tell me a little about yourself and your goal.', loading: 'Loading available times …', none: 'There are no free times right now. <a href="../#kontakt">Just write to me</a> and we’ll find one.', loadFail: 'The available times couldn’t be loaded just now. Please try again in a moment or <a href="../#kontakt">write to me</a>.', noFree: 'no free times', name: 'Please enter your name.', mail: 'Please enter a valid email address.', consent: 'Please confirm your consent to data processing.', taken: 'This time has just been taken. Please choose another one.', limit: 'You already have two open requests. I’ll get back to you soon.', fail: 'Unfortunately, that didn’t work. Please try again or email me directly at ', sending: 'Sending …', demo: 'Preview with test data – nothing will be booked.' },
    bs: { blocked: 'Nažalost, za ovu e-mail adresu online rezervacija nije moguća.', msg: 'Molim te, napiši mi ukratko nešto o sebi i svom cilju.', loading: 'Učitavam slobodne termine …', none: 'Trenutno nema slobodnih termina. <a href="../#kontakt">Samo mi piši</a> pa ćemo naći termin.', loadFail: 'Slobodni termini se trenutno ne mogu učitati. Pokušaj ponovo za koji trenutak ili mi <a href="../#kontakt">piši</a>.', noFree: 'nema slobodnih termina', name: 'Molim te, upiši svoje ime.', mail: 'Molim te, upiši ispravnu e-mail adresu.', consent: 'Molim te, potvrdi saglasnost za obradu podataka.', taken: 'Ovaj termin je upravo zauzet. Molim te, izaberi drugi.', limit: 'Već imaš dva otvorena zahtjeva. Javit ću ti se uskoro.', fail: 'Nažalost, nije uspjelo. Pokušaj ponovo ili mi piši direktno na ', sending: 'Šaljem …', demo: 'Pregled s testnim podacima – ništa se ne rezerviše.' },
    ar: { blocked: 'للأسف، لا يمكن الحجز عبر الإنترنت بهذا البريد الإلكتروني.', msg: 'يرجى أن تكتب لي باختصار عن نفسك وعن هدفك.', loading: 'جارٍ تحميل المواعيد المتاحة …', none: 'لا توجد مواعيد متاحة حاليًا. <a href="../#kontakt">راسلني</a> وسنجد موعدًا معًا.', loadFail: 'تعذّر تحميل المواعيد المتاحة الآن. حاول مرة أخرى بعد قليل أو <a href="../#kontakt">راسلني</a>.', noFree: 'لا مواعيد متاحة', name: 'يرجى إدخال اسمك.', mail: 'يرجى إدخال بريد إلكتروني صحيح.', consent: 'يرجى تأكيد موافقتك على معالجة البيانات.', taken: 'حُجز هذا الموعد للتوّ. يرجى اختيار موعد آخر.', limit: 'لديك طلبان مفتوحان بالفعل. سأتواصل معك قريبًا.', fail: 'للأسف لم يتم الإرسال. حاول مرة أخرى أو راسلني مباشرة على ', sending: 'جارٍ الإرسال …', demo: 'معاينة ببيانات تجريبية، لن يُحجز أي موعد.' }
  };
  var T = TXT[LANG] || TXT.de;
  var LERNWEG = '';
  var DEMO = !TERMIN_ENDPOINT || /[?&]demo=1\b/.test(location.search);

  var $ = function (id) { return document.getElementById(id); };
  var pick = $('pt-pick'), form = $('pt-form'), done = $('pt-done');
  var daysEl = $('pt-days'), wdEl = $('pt-wd'), mname = $('pt-mname'), prev = $('pt-prev'), next = $('pt-next');
  var status = $('pt-status'), slotbox = $('pt-slotbox'), slotsEl = $('pt-slots'), dayname = $('pt-dayname');
  var go = $('pt-go'), errorBox = $('pt-error'), submit = form.querySelector('.pd-submit');

  /* ---------- Zeitzone und Formate (immer Ortszeit des Besuchers) ---------- */
  var TZ = 'UTC';
  try { TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
  $('pt-tzname').textContent = TZ.replace(/_/g, ' ');
  var fKey = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  var fTime = new Intl.DateTimeFormat(LOC, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  var fDay = new Intl.DateTimeFormat(LOC, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
  var fMonth = new Intl.DateTimeFormat(LOC, { timeZone: 'UTC', month: 'long', year: 'numeric' });
  /* Arabische Wochentage sind auch in Kurzform lang: auf dem Handy nur der Anfangsbuchstabe */
  var fWd = new Intl.DateTimeFormat(LOC, { timeZone: 'UTC', weekday: LANG === 'ar' && window.matchMedia('(max-width: 560px)').matches ? 'narrow' : 'short' });
  var fNum = new Intl.NumberFormat(LOC);
  function key(d) { var p = fKey.formatToParts(d), g = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; }; return g('year') + '-' + g('month') + '-' + g('day'); }
  function keyDate(k) { var a = k.split('-'); return new Date(Date.UTC(+a[0], a[1] - 1, +a[2], 12)); }
  function range(d) { return fTime.format(d) + '–' + fTime.format(new Date(d.getTime() + duration * 60000)); }

  /* Wochentage, Woche beginnt am Montag */
  wdEl.innerHTML = '';
  for (var i = 0; i < 7; i++) { var s = document.createElement('span'); s.textContent = fWd.format(new Date(Date.UTC(2024, 0, 1 + i, 12))); wdEl.appendChild(s); }

  /* ---------- Zustand ---------- */
  var byDay = {}, months = [], mi = 0, selDay = null, selSlot = null, duration = 30, loadedAt = 0, todayKey = key(new Date());

  if (DEMO) { $('pt-demo').hidden = false; $('pt-demo').textContent = T.demo; }

  function setStatus(html) { status.innerHTML = html || ''; }

  function load(keepDay) {
    setStatus(T.loading);
    skeleton();
    var p = DEMO ? demoSlots() : fetch(TERMIN_ENDPOINT + '?a=slots', { cache: 'no-store' }).then(function (r) { return r.json(); });
    return p.then(function (res) {
      if (!res || !res.ok) throw new Error('slots');
      duration = res.duration || 30;
      byDay = {};
      res.slots.forEach(function (iso) { var d = new Date(iso); (byDay[key(d)] = byDay[key(d)] || []).push(d); });
      loadedAt = Date.now();
      var keys = Object.keys(byDay).sort();
      months = [];
      var first = todayKey.slice(0, 7), last = keys.length ? keys[keys.length - 1].slice(0, 7) : first;
      for (var m = first; m <= last; m = nextMonth(m)) months.push(m);
      if (!keys.length) { setStatus(T.none); selDay = null; render(); return; }
      setStatus('');
      if (!(keepDay && byDay[selDay])) selDay = keys[0];
      if (selSlot && !(byDay[selDay] || []).some(function (d) { return d.getTime() === selSlot.getTime(); })) selSlot = null;
      mi = Math.max(0, months.indexOf(selDay.slice(0, 7)));
      render();
    }).catch(function () { setStatus(T.loadFail); months = [todayKey.slice(0, 7)]; mi = 0; byDay = {}; selDay = null; render(); });
  }
  function nextMonth(m) { var y = +m.slice(0, 4), mo = +m.slice(5, 7) + 1; if (mo > 12) { mo = 1; y++; } return y + '-' + (mo < 10 ? '0' : '') + mo; }

  function skeleton() {
    daysEl.innerHTML = '';
    for (var i = 0; i < 35; i++) { var b = document.createElement('span'); b.className = 'pt-day pt-skel'; daysEl.appendChild(b); }
    slotbox.hidden = true;
  }

  /* ---------- Monat zeichnen ---------- */
  function render() {
    var m = months[mi] || todayKey.slice(0, 7), y = +m.slice(0, 4), mo = +m.slice(5, 7);
    mname.textContent = fMonth.format(new Date(Date.UTC(y, mo - 1, 15)));
    prev.disabled = mi <= 0; next.disabled = mi >= months.length - 1;
    daysEl.innerHTML = '';
    var lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7;
    var n = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    for (var i = 0; i < lead; i++) daysEl.appendChild(document.createElement('span'));
    for (var d = 1; d <= n; d++) {
      var k = m + '-' + (d < 10 ? '0' : '') + d, on = !!byDay[k];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pt-day' + (on ? ' on' : '') + (k === selDay ? ' sel' : '') + (k === todayKey ? ' today' : '');
      b.textContent = fNum.format(d);
      b.setAttribute('aria-label', fDay.format(keyDate(k)) + (on ? '' : ', ' + T.noFree));
      if (on) { b.setAttribute('aria-pressed', k === selDay ? 'true' : 'false'); b.dataset.k = k; } else b.disabled = true;
      daysEl.appendChild(b);
    }
    renderSlots();
  }

  function renderSlots() {
    var list = selDay && byDay[selDay];
    slotbox.hidden = !list;
    go.disabled = !selSlot;
    if (!list) return;
    dayname.textContent = fDay.format(keyDate(selDay));
    slotsEl.innerHTML = '';
    list.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pt-slot'; b.textContent = fTime.format(d); b.dataset.t = d.getTime();
      b.setAttribute('aria-pressed', selSlot && selSlot.getTime() === d.getTime() ? 'true' : 'false');
      b.setAttribute('aria-label', fDay.format(keyDate(selDay)) + ', ' + range(d));
      slotsEl.appendChild(b);
    });
  }

  daysEl.addEventListener('click', function (e) {
    var b = e.target.closest('.pt-day.on'); if (!b) return;
    selDay = b.dataset.k; selSlot = null; render();
    var first = slotsEl.querySelector('.pt-slot');
    if (window.matchMedia('(max-width: 560px)').matches) slotbox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (first && e.detail === 0) first.focus();
  });
  slotsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.pt-slot'); if (!b) return;
    selSlot = new Date(+b.dataset.t); renderSlots();
    var nb = slotsEl.querySelector('[data-t="' + b.dataset.t + '"]'); if (nb) nb.focus();
  });
  prev.addEventListener('click', function () { if (mi > 0) { mi--; render(); } });
  next.addEventListener('click', function () { if (mi < months.length - 1) { mi++; render(); } });

  /* ---------- Schritt 2 ---------- */
  function chosenText() { return fDay.format(keyDate(selDay)) + ', ' + range(selSlot); }
  go.addEventListener('click', function () {
    if (!selSlot) return;
    $('pt-chosen').textContent = chosenText();
    pick.hidden = true; form.hidden = false; errorBox.hidden = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { $('pt-name').focus({ preventScroll: true }); }, 350);
  });
  $('pt-change').addEventListener('click', backToPick);
  function backToPick() {
    form.hidden = true; pick.hidden = false;
    if (Date.now() - loadedAt > 60000) load(true); else render();
  }

  function showError(msg, field) {
    errorBox.textContent = msg; errorBox.hidden = false;
    if (field) field.focus({ preventScroll: true });
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = $('pt-name'), mailEl = $('pt-mail'), name = nameEl.value.trim(), email = mailEl.value.trim();
    if (!name) { showError(T.name, nameEl); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showError(T.mail, mailEl); return; }
    var msgEl = $('pt-msg');
    if (msgEl.value.trim().length < 3) { showError(T.msg, msgEl); return; }
    if (!$('pt-consent').checked) { showError(T.consent, $('pt-consent')); return; }
    var langs = [].map.call(form.querySelectorAll('input[name="lernsprachen"]:checked'), function (x) { return x.value; });
    var art = form.querySelector('input[name="art"]:checked');
    var payload = { lernweg: LERNWEG, name: name, email: email, start: selSlot.toISOString(), lang: LANG, lernsprachen: langs,
      art: art ? art.value : '', nachricht: $('pt-msg').value, tz: TZ, consent: true, hp: form.querySelector('.pt-hp').value };
    errorBox.hidden = true; submit.disabled = true;
    var label = submit.firstChild.nodeValue; submit.firstChild.nodeValue = T.sending + ' ';
    var req = DEMO ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 700); })
      : fetch(TERMIN_ENDPOINT, { method: 'POST', body: JSON.stringify(payload) }).then(function (r) { return r.json(); });
    req.then(function (res) {
      if (res && res.ok) {
        $('pt-donewhen').textContent = chosenText();
        form.hidden = true; done.hidden = false; done.focus({ preventScroll: true }); card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      var err = res && res.error;
      if (err === 'taken' || err === 'slot') { backToPick(); load(true); setStatus(T.taken); selSlot = null; return; }
      if (err === 'limit') return showError(T.limit);
      if (err === 'blocked') return showError(T.blocked);
      if (err === 'name') return showError(T.name);
      if (err === 'email') return showError(T.mail);
      if (err === 'msg') return showError(T.msg);
      throw new Error(err || 'fail');
    }).catch(function () { showError(T.fail + MAIL + '.'); })
      .then(function () { submit.disabled = false; submit.firstChild.nodeValue = label; });
  });

  /* Wer länger auf der Seite bleibt, bekommt beim Zurückkehren frische Zeiten */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !pick.hidden && Date.now() - loadedAt > 120000) load(true);
  });

  /* ---------- Testdaten für die Vorschau ---------- */
  function demoSlots() {
    var out = [], now = Date.now(), step = 1800000, from = Math.ceil((now + 86400000) / step) * step, to = now + 28 * 86400000;
    var fH = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' });
    for (var t = from; t + step <= to; t += step) {
      var p = fH.formatToParts(new Date(t)), g = function (x) { return p.filter(function (q) { return q.type === x; })[0].value; };
      var min = +g('hour') * 60 + +g('minute');
      if (min < 540 || min + 30 > 1260) continue;
      var r = Math.sin(t / 3600000 * 12.9898) * 43758.5453; r -= Math.floor(r);
      var dayR = Math.sin(Math.floor(t / 86400000) * 78.233) * 43758.5453; dayR -= Math.floor(dayR);
      if (g('weekday') === 'Sun' || dayR < 0.18 || r < 0.55) continue;
      out.push(new Date(t).toISOString());
    }
    return new Promise(function (res) { setTimeout(function () { res({ ok: true, duration: 30, slots: out }); }, 500); });
  }

  /* Vorauswahl aus dem Link, z. B. ?sprache=Arabisch (Arabisch-Seite) oder ?art=Unterricht (Startseite) */
  var q = {};
  location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) { q[k] = decodeURIComponent(v.replace(/\+/g, ' ')); });
  /* Lernweg (von den Karten „Diesen Weg anfragen“) geht nur in die Mail an mich */
  LERNWEG = ['Von Null an', 'Grundlagen der Sprache', 'Begleitung im Studium', 'Mit bosnischen Wurzeln', 'Ankommen in Bosnien', 'Weiß ich noch nicht'].indexOf(q.lernweg) >= 0 ? q.lernweg : '';
  [].forEach.call(form.querySelectorAll('input[name="lernsprachen"], input[name="art"]'), function (inp) {
    if ((inp.name === 'lernsprachen' && inp.value === q.sprache) || (inp.name === 'art' && inp.value === q.art)) inp.checked = true;
  });

  load(false);
})();
