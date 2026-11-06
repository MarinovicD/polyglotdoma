/* polyglot.doma – Seitenlogik (Menü, Formular) */

/* ===== EINSTELLUNGEN =====
   Das Formular wird über Web3Forms (web3forms.com) verschickt.
   WEB3FORMS_KEY: Access Key von web3forms.com (kommt per E-Mail). Solange leer, öffnet
   "Nachricht senden" ersatzweise das E-Mail-Programm der Besucher.
   CONTACT_EMAIL: Kontaktadresse für Fehlermeldungen und den Ersatzweg. */
var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
var WEB3FORMS_KEY = '';
var CONTACT_EMAIL = 'info@talaqa-lab.com';

(function () {
  'use strict';

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

  /* Angebots-Buttons wählen das Anliegen vor */
  document.querySelectorAll('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      topic.value = a.getAttribute('data-topic');
      syncFormat();
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
    if (!name) { showError('Bitte gib deinen Namen an.'); form.elements.name.focus(); return; }
    if (!mail || !form.elements.email.checkValidity()) { showError('Bitte gib eine gültige E-Mail-Adresse an.'); form.elements.email.focus(); return; }
    if (!form.elements.nachricht.value.trim()) { showError('Bitte schreib mir eine kurze Nachricht.'); form.elements.nachricht.focus(); return; }
    if (!form.elements.einwilligung.checked) { showError('Bitte bestätige die Einwilligung zur Datenverarbeitung.'); return; }

    var topicText = topic.options[topic.selectedIndex].text;
    var lines = [
      'Name: ' + name,
      'E-Mail: ' + mail,
      'Lernsprachen: ' + (values('lernsprachen').join(', ') || '–'),
      'Anliegen: ' + topicText
    ];
    if (!formatBox.disabled) lines.push('Einzel/Gruppe: ' + (values('format').join(', ') || '–'));
    lines.push('Arbeitssprache: ' + (values('arbeitssprache').join(', ') || '–'));
    lines.push('', form.elements.nachricht.value.trim() || '(keine Nachricht)');

    if (!WEB3FORMS_KEY) {
      var subject = 'Anfrage über polyglot.doma: ' + topicText;
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      showDone();
      return;
    }

    var data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);
    data.append('subject', 'Anfrage über polyglot.doma: ' + topicText);
    data.append('from_name', 'polyglot.doma Website');
    data.append('zusammenfassung', lines.join('\n'));
    submitBtn.disabled = true;
    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || r.status); showDone(); form.reset(); syncFormat(); }); })
      .catch(function () { showError('Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib mir direkt an ' + CONTACT_EMAIL + '.'); })
      .then(function () { submitBtn.disabled = false; });
  });

  var again = document.getElementById('pd-again');
  if (again) again.addEventListener('click', function () { form.reset(); syncFormat(); showForm(); form.elements.name.focus(); });
})();
