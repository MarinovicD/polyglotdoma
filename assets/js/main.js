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
    de: { name: 'Bitte gib deinen Namen an.', mail: 'Bitte gib eine gültige E-Mail-Adresse an.', msg: 'Bitte schreib mir eine kurze Nachricht.', consent: 'Bitte bestätige die Einwilligung zur Datenverarbeitung.', fail: 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib mir direkt an ' },
    en: { name: 'Please enter your name.', mail: 'Please enter a valid email address.', msg: 'Please write me a short message.', consent: 'Please confirm your consent to data processing.', fail: "Unfortunately, that didn't work. Please try again or email me directly at " },
    bs: { name: 'Molim te, upiši svoje ime.', mail: 'Molim te, upiši ispravnu e-mail adresu.', msg: 'Molim te, napiši mi kratku poruku.', consent: 'Molim te, potvrdi saglasnost za obradu podataka.', fail: 'Nažalost, nije uspjelo. Pokušaj ponovo ili mi piši direktno na ' },
    ar: { name: 'يرجى إدخال اسمك.', mail: 'يرجى إدخال بريد إلكتروني صحيح.', msg: 'يرجى كتابة رسالة قصيرة.', consent: 'يرجى تأكيد موافقتك على معالجة البيانات.', fail: 'للأسف لم يتم الإرسال. حاول مرة أخرى أو راسلني مباشرة على ' }
  };
  var T = MSG[LANG] || MSG.de;
  /* Anfrage-Mails an mich bleiben immer auf Deutsch */
  var TOPIC_DE = { kennenlernen: 'Ich möchte ein kostenfreies Kennenlerngespräch', konversation: 'Ich interessiere mich für Konversationsstunden', frage: 'Ich habe eine Frage zum Unterricht', anderes: 'Etwas anderes' };
  var LANG_DE = { de: 'Deutsch', en: 'Englisch', bs: 'Bosnisch', ar: 'Arabisch' };

  /* ---------- Menü (schmale Bildschirme) ---------- */
  var menuBtn = document.querySelector('.pd-menubtn');
  var menu = document.getElementById('pd-menu');
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1320) setMenu(false); });
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

  function syncFormat() {
    var conv = topic.value === 'konversation';
    formatBox.hidden = conv;
    formatBox.disabled = conv;
  }
  topic.addEventListener('change', syncFormat);
  syncFormat();

  /* Angebots-Buttons wählen das Anliegen (und auf Sprachseiten den Lernweg) vor */
  document.querySelectorAll('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      topic.value = a.getAttribute('data-topic');
      syncFormat();
      var weg = a.getAttribute('data-lernweg');
      if (weg) {
        form.querySelectorAll('input[name="lernweg"]').forEach(function (r) { r.checked = r.value === weg; });
      }
      showForm();
    });
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
      'Website-Sprache: ' + (LANG_DE[LANG] || LANG)
    ];
    if (form.querySelector('input[name="lernweg"]')) lines.push('Lernweg: ' + (values('lernweg').join(', ') || '–'));
    if (document.body.getAttribute('data-seite')) lines.push('Gesendet von: ' + document.body.getAttribute('data-seite'));
    if (!formatBox.disabled) lines.push('Einzel/Gruppe: ' + (values('format').join(', ') || '–'));
    lines.push('Arbeitssprache: ' + (values('arbeitssprache').join(', ') || '–'));
    lines.push('', form.elements.nachricht.value.trim() || '(keine Nachricht)');

    var data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);
    data.append('subject', 'Anfrage über polyglot.doma: ' + topicText);
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
