/* polyglot.doma – Mini-Lektion „So funktioniert die arabische Schrift“
   Die Texte stehen im HTML (für Übersetzungen); hier nur Blättern, Quiz und Verbindungs-Animation. */
(function () {
  'use strict';
  var box = document.getElementById('pl-lesson');
  if (!box) return;
  var steps = Array.prototype.slice.call(box.querySelectorAll('.pl-step'));
  var fill = box.querySelector('.pl-fill');
  var count = box.querySelector('.pl-count');
  var prev = box.querySelector('.pl-prev');
  var next = box.querySelector('.pl-next');
  var cur = 0, timers = [];
  var ar = document.documentElement.lang === 'ar';
  function num(n) { return ar ? String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(n); }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function show(i) {
    clearTimers();
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, j) {
      s.hidden = j !== cur;
      s.classList.toggle('pl-in', j === cur);
    });
    fill.style.width = ((cur + 1) / steps.length * 100) + '%';
    count.textContent = num(cur + 1) + ' / ' + num(steps.length);
    prev.hidden = cur === 0;
    next.hidden = cur === steps.length - 1;
    var join = steps[cur].querySelector('.pl-join');
    if (join) resetJoin(steps[cur]);
  }

  prev.addEventListener('click', function () { show(cur - 1); });
  next.addEventListener('click', function () { show(cur + 1); });
  box.querySelectorAll('.pl-restart').forEach(function (b) {
    b.addEventListener('click', function () { resetQuizzes(); show(0); });
  });

  /* ---------- Fatha in eigener Farbe ----------
     Browser färben ein Vokalzeichen nicht getrennt vom Buchstaben. Deshalb zwei deckungsgleiche Ebenen:
     unten Buchstabe + Fatha in Fatha-Farbe, oben nur der Buchstabe in seiner Farbe. Bei .pl-v-in wird die
     untere Ebene eingeblendet, die Fatha erscheint also erst nach dem Buchstaben. */
  box.querySelectorAll('.pl-v').forEach(function (el) {
    var full = el.textContent, base = el.getAttribute('data-base');
    el.textContent = '';
    [['pl-v-mark', full], ['pl-v-base', base]].forEach(function (x) {
      var s = document.createElement('span'); s.className = x[0]; s.setAttribute('aria-hidden', 'true'); s.textContent = x[1]; el.appendChild(s);
    });
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = full; el.appendChild(sr);
  });

  /* ---------- Quiz ---------- */
  function resetQuizzes() {
    box.querySelectorAll('.pl-quiz button').forEach(function (b) { b.classList.remove('ok', 'no'); });
    box.querySelectorAll('.pl-fb').forEach(function (f) { f.textContent = ''; f.className = 'pl-fb'; });
  }
  box.querySelectorAll('.pl-quiz').forEach(function (q) {
    var fb = q.parentNode.querySelector('.pl-fb');
    q.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var right = b.getAttribute('data-a') === q.getAttribute('data-right');
        q.querySelectorAll('button').forEach(function (o) { if (!o.classList.contains('ok')) o.classList.remove('no'); });
        b.classList.add(right ? 'ok' : 'no');
        fb.textContent = b.getAttribute('data-fb');
        fb.className = 'pl-fb ' + (right ? 'ok' : 'no');
      });
    });
  });

  /* ---------- Verbindungs-Animation ----------
     Die Buchstaben sind eine Vektorgrafik aus Markazi Text (assets: _i18n nicht betroffen), damit Safari die
     Vokalzeichen nicht verschiebt. Je Buchstabe eine Gruppe .pl-g mit Einzelform (.pl-iso) und verbundener
     Form (.pl-con); data-s0/-s1 = Versatz in Font-Einheiten je Phase. */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function parts(step) {
    return {
      join: step.querySelector('.pl-join'),
      groups: Array.prototype.slice.call(step.querySelectorAll('.pl-g')),
      ex: step.querySelector('.pl-ex'),
      btn: step.querySelector('.pl-play')
    };
  }
  /* Lage je Phase: 0 = Einzelformen gespreizt, 1 = Wortformen gespreizt, 2 = zusammen */
  function place(p, phase) {
    p.groups.forEach(function (g) { g.style.transform = 'translateX(' + (phase < 2 ? g.getAttribute('data-s' + phase) : 0) + 'px)'; });
  }
  function resetJoin(step) {
    var p = parts(step);
    if (!p.ex.hasAttribute('data-t0')) p.ex.setAttribute('data-t0', p.ex.textContent);
    if (!p.btn.hasAttribute('data-first')) p.btn.setAttribute('data-first', p.btn.textContent);
    p.join.classList.add('pl-still');
    p.join.removeAttribute('data-con');
    p.join.removeAttribute('data-done');
    place(p, 0);
    void p.join.getBoundingClientRect();
    p.join.classList.remove('pl-still');
    p.ex.textContent = p.ex.getAttribute('data-t0');
    p.btn.textContent = p.btn.getAttribute('data-first');
    p.btn.style.visibility = '';
    step.setAttribute('data-phase', '0');
  }
  /* Drei Phasen, jede per Klick: 0 einzeln → 1 Wortformen → 2 zusammengerückt. Kein automatisches Weiterlaufen. */
  box.querySelectorAll('.pl-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = btn.closest('.pl-step');
      var p = parts(step);
      var phase = +(step.getAttribute('data-phase') || 0);
      clearTimers();
      if (phase === 0) {
        p.join.classList.add('pl-still');
        p.join.setAttribute('data-con', '');
        place(p, 1);
        void p.join.getBoundingClientRect();
        p.join.classList.remove('pl-still');
        p.ex.textContent = p.ex.getAttribute('data-t1');
        btn.textContent = btn.getAttribute('data-next');
        step.setAttribute('data-phase', '1');
      } else if (phase === 1) {
        place(p, 2);
        p.ex.textContent = p.ex.getAttribute('data-t2');
        btn.style.visibility = 'hidden';
        timers.push(setTimeout(function () {
          p.join.setAttribute('data-done', '');
          p.ex.textContent = p.ex.getAttribute('data-t3');
          btn.textContent = btn.getAttribute('data-again');
          btn.style.visibility = '';
          step.setAttribute('data-phase', '2');
        }, reduce ? 100 : 1500));
      } else {
        resetJoin(step);
      }
    });
  });

  show(0);
})();
