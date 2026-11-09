/* polyglot.doma – Seitenlogik (Menü, Formular) */

/* ===== EINSTELLUNGEN =====
   Das Formular wird über Web3Forms (web3forms.com) verschickt.
   WEB3FORMS_KEY: Access Key von web3forms.com (Anfragen gehen an info@talaqa-lab.com).
   CONTACT_EMAIL: wird in der Fehlermeldung genannt, falls das Senden scheitert. */
var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
var WEB3FORMS_KEY = '79d0c64b-8fa2-4c09-9222-6e8390520dae';
var CONTACT_EMAIL = 'info@talaqa-lab.com';

(function () {
  'use strict';

  /* ---------- Sprache der Seite ---------- */
  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  var MSG = {
    de: { name: 'Bitte gib deinen Namen an.', mail: 'Bitte gib eine gültige E-Mail-Adresse an.', msg: 'Bitte schreib mir eine kurze Nachricht.', consent: 'Bitte bestätige die Einwilligung zur Datenverarbeitung.', close: 'Schließen', fail: 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib mir direkt an ' },
    en: { name: 'Please enter your name.', mail: 'Please enter a valid email address.', msg: 'Please write me a short message.', consent: 'Please confirm your consent to data processing.', close: 'Close', fail: "Unfortunately, that didn't work. Please try again or email me directly at " },
    bs: { name: 'Molim te, upiši svoje ime.', mail: 'Molim te, upiši ispravnu e-mail adresu.', msg: 'Molim te, napiši mi kratku poruku.', consent: 'Molim te, potvrdi saglasnost za obradu podataka.', close: 'Zatvori', fail: 'Nažalost, nije uspjelo. Pokušaj ponovo ili mi piši direktno na ' },
    ar: { name: 'يرجى إدخال اسمك.', mail: 'يرجى إدخال بريد إلكتروني صحيح.', msg: 'يرجى كتابة رسالة قصيرة.', consent: 'يرجى تأكيد موافقتك على معالجة البيانات.', close: 'إغلاق', fail: 'للأسف لم يتم الإرسال. حاول مرة أخرى أو راسلني مباشرة على ' }
  };
  var T = MSG[LANG] || MSG.de;
  /* Anfrage-Mails an mich bleiben immer auf Deutsch */
  var TOPIC_DE = { kennenlernen: 'Ich möchte ein kostenfreies Kennenlerngespräch', konversation: 'Ich interessiere mich für Konversationsstunden', frage: 'Ich habe eine Frage zum Unterricht', anderes: 'Etwas anderes' };
  var LANG_DE = { de: 'Deutsch', en: 'Englisch', bs: 'Bosnisch', ar: 'Arabisch' };

  /* ---------- Menü (schmale Bildschirme) ---------- */
  /* Sprachumschalter (details.pd-lsw, Kopfzeile und Handy-Menü): schließen bei Klick daneben oder mit Escape */
  [].forEach.call(document.querySelectorAll('.pd-lsw'), function (lsw) {
    document.addEventListener('click', function (e) { if (lsw.open && !lsw.contains(e.target)) lsw.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lsw.open) { lsw.open = false; lsw.querySelector('summary').focus(); } });
  });

  /* Kopfzeilen-Button „Kennenlerngespräch vereinbaren“: nur einblenden, solange der gleiche Button
     im Hero nicht zu sehen ist (sonst stünden zwei gleiche Buttons übereinander) */
  var ctaHead = document.querySelector('.pd-cta');
  var ctaHero = document.querySelector('#top a.pd-btn[data-termin]');
  if (ctaHead && ctaHero && 'IntersectionObserver' in window) {
    ctaHead.classList.add('pd-cta-off');
    new IntersectionObserver(function (en) {
      ctaHead.classList.toggle('pd-cta-off', en[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(ctaHero);
  }

  var menuBtn = document.querySelector('.pd-menubtn');
  var menu = document.getElementById('pd-menu');
  /* Handy-Menü: Es scrollt selbst (max. bis zum unteren Bildschirmrand), die Seite darunter bleibt stehen. */
  function fitMenu() {
    if (!menu || menu.hidden) return;
    var top = menu.getBoundingClientRect().top;
    menu.style.maxHeight = Math.max(160, window.innerHeight - top - 12) + 'px';
  }
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    document.documentElement.classList.toggle('pd-menu-open', open);
    if (open) { menu.scrollTop = 0; fitMenu(); }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1320) setMenu(false); else fitMenu(); });
    /* Aufgeklappte Liste im Menü (z. B. Sprache der Website) automatisch ganz ins Bild scrollen */
    menu.addEventListener('toggle', function (e) {
      fitMenu();
      var d = e.target;
      if (!d.open) return;
      requestAnimationFrame(function () {
        var mb = menu.getBoundingClientRect(), db = d.getBoundingClientRect();
        var delta = db.bottom - mb.bottom + 12;
        if (db.top - delta < mb.top) delta = db.top - mb.top - 12;   // Kopf der Liste nicht aus dem Bild schieben
        if (delta > 0) menu.scrollBy({ top: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }, true);
  }

  /* ---------- Video: eigener Play-Knopf, lädt erst beim Klick ---------- */
  var video = document.getElementById('pd-video');
  var vplay = document.querySelector('.pd-vplay');
  if (video && vplay) {
    video.controls = false;
    vplay.hidden = false;
    vplay.addEventListener('click', function () { video.controls = true; video.play(); });
    video.addEventListener('play', function () { vplay.hidden = true; video.controls = true; });
  }

  /* ---------- Formular ---------- */
  var form = document.getElementById('pd-form');
  if (!form) return;
  var topic = document.getElementById('pd-topic');
  var formatBox = document.getElementById('pd-format');
  var errorBox = document.getElementById('pd-error');
  var doneBox = document.getElementById('pd-done');
  var submitBtn = form.querySelector('.pd-submit');

  /* "Was suchst du?": Einzel/Gruppe nur bei Unterricht, Lernweg (Sprachseiten) nicht bei Konversation */
  function art() { var r = form.querySelector('input[name="art"]:checked'); return r ? r.value : ''; }
  function setArt(v) { form.querySelectorAll('input[name="art"]').forEach(function (r) { r.checked = r.value === v; }); }
  function syncFormat() {
    var a = art();
    formatBox.hidden = formatBox.disabled = a !== 'Unterricht';
    var wegBox = document.getElementById('pd-lernweg');
    if (wegBox) { wegBox.hidden = wegBox.disabled = a === 'Konversation'; }
  }
  form.querySelectorAll('input[name="art"]').forEach(function (r) { r.addEventListener('change', syncFormat); });
  syncFormat();

  /* ---------- Formular als Pop-up ----------
     Alle Links auf #kontakt öffnen das Formular an Ort und Stelle. Dafür wandert die
     Formularkarte in ein <dialog> und beim Schließen zurück an ihren Platz unten auf
     der Seite (es gibt also nur ein Formular). Ohne <dialog>-Unterstützung oder ohne
     JavaScript scrollen die Links wie bisher nach unten. */
  var card = form.closest('.pd-formcard');
  var dlg = null, spot = null;
  if (card && typeof HTMLDialogElement === 'function') {
    dlg = document.createElement('dialog');
    dlg.className = 'pd-dialog';
    dlg.setAttribute('aria-label', form.getAttribute('aria-label') || 'Kontakt');
    dlg.innerHTML = '<button class="pd-x" type="button" aria-label="' + T.close + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg></button>';
    document.body.appendChild(dlg);
    spot = document.createElement('div');
    spot.setAttribute('aria-hidden', 'true');
    dlg.querySelector('.pd-x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      if (spot.parentNode) { spot.parentNode.replaceChild(card, spot); }
      document.documentElement.classList.remove('pd-modal');
    });
  }
  function openPopup() {
    if (!dlg) return false;
    if (dlg.open) return true;
    /* Platzhalter hält unten die Höhe, damit die Seite dahinter nicht springt */
    spot.style.flex = card.style.flex;
    spot.style.height = card.offsetHeight + 'px';
    card.parentNode.replaceChild(spot, card);
    dlg.appendChild(card);
    document.documentElement.classList.add('pd-modal');
    dlg.showModal();
    dlg.scrollTop = 0;
    return true;
  }

  /* Kontaktbereich, Karte „oder – Schreib mir“: Formular in die Bildmitte holen (passt es nicht, an den Anfang) */
  document.addEventListener('click', function (e) {
    var w = e.target.closest('a.pk-way-form');
    if (!w) return;
    var fc = document.querySelector('.pd-formcard');
    if (!fc || (dlg && dlg.contains(fc))) return;
    e.preventDefault();
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fc.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: fc.offsetHeight < window.innerHeight - 100 ? 'center' : 'start' });
    var first = form.querySelector('input:not([type="hidden"]):not([tabindex="-1"])');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, smooth ? 700 : 0);
  });

  /* Anfrage-Buttons: Anliegen (und auf Sprachseiten den Lernweg) vorwählen, dann Pop-up öffnen */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#kontakt"]');
    if (!a || (dlg && dlg.contains(a))) return;
    if (a.hasAttribute('data-topic')) {
      var t = a.getAttribute('data-topic');
      if (t === 'konversation') { topic.value = 'kennenlernen'; setArt('Konversation'); }
      else topic.value = t;
      if (a.getAttribute('data-art')) setArt(a.getAttribute('data-art'));
      var weg = a.getAttribute('data-lernweg');
      if (weg) {
        if (weg !== 'Weiß ich noch nicht') setArt('Unterricht');
        form.querySelectorAll('input[name="lernweg"]').forEach(function (r) { r.checked = r.value === weg; });
      }
      syncFormat();
    }
    showForm();
    if (openPopup()) e.preventDefault();
  });

  /* "Noch unsicher" schließt die anderen Lernsprachen aus */
  var langBoxes = form.querySelectorAll('input[name="lernsprachen"]');
  langBoxes.forEach(function (box) {
    box.addEventListener('change', function () {
      if (!box.checked) return;
      langBoxes.forEach(function (other) {
        if (other === box) return;
        if (box.value === 'Noch unsicher' || other.value === 'Noch unsicher') other.checked = false;
      });
    });
  });

  /* Radio-Chips lassen sich wieder abwählen */
  form.querySelectorAll('input[type="radio"]').forEach(function (r) {
    r.addEventListener('mousedown', function () { r.dataset.was = r.checked ? '1' : ''; });
    r.addEventListener('click', function () { if (r.dataset.was === '1') { r.checked = false; r.dataset.was = ''; } });
  });

  function values(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = !msg; }
  function showForm() { form.hidden = false; doneBox.hidden = true; }
  function showDone() { form.hidden = true; doneBox.hidden = false; doneBox.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showError('');
    var name = form.elements.name.value.trim();
    var mail = form.elements.email.value.trim();
    if (!name) { showError(T.name); form.elements.name.focus(); return; }
    if (!mail || !form.elements.email.checkValidity()) { showError(T.mail); form.elements.email.focus(); return; }
    if (!form.elements.nachricht.value.trim()) { showError(T.msg); form.elements.nachricht.focus(); return; }
    if (!form.elements.einwilligung.checked) { showError(T.consent); return; }

    var topicText = TOPIC_DE[topic.value] || topic.options[topic.selectedIndex].text;
    var lines = [
      'Name: ' + name,
      'E-Mail: ' + mail,
      'Lernsprachen: ' + (values('lernsprachen').join(', ') || '–'),
      'Anliegen: ' + topicText,
      'Sucht: ' + (art() || '–'),
      'Website-Sprache: ' + (LANG_DE[LANG] || LANG)
    ];
    var wegField = document.getElementById('pd-lernweg');
    if (wegField && !wegField.disabled) lines.push('Lernweg: ' + (values('lernweg').join(', ') || '–'));
    if (document.body.getAttribute('data-seite')) lines.push('Gesendet von: ' + document.body.getAttribute('data-seite'));
    if (!formatBox.disabled) lines.push('Einzel/Gruppe: ' + (values('format').join(', ') || '–'));
    lines.push('', form.elements.nachricht.value.trim() || '(keine Nachricht)');

    var data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);
    data.append('subject', 'Anfrage über polyglot.doma: ' + topicText + (art() ? ' · ' + art() : ''));
    data.append('from_name', 'polyglot.doma Website');
    data.append('zusammenfassung', lines.join('\n'));
    data.append('website_sprache', LANG_DE[LANG] || LANG);
    submitBtn.disabled = true;
    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || r.status); showDone(); form.reset(); syncFormat(); }); })
      .catch(function () { showError(T.fail + CONTACT_EMAIL + (LANG === 'ar' ? '' : '.')); })
      .then(function () { submitBtn.disabled = false; });
  });

  var again = document.getElementById('pd-again');
  if (again) again.addEventListener('click', function () { form.reset(); syncFormat(); showForm(); form.elements.name.focus(); });
})();
