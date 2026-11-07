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

  /* ---------- Verbindungs-Animation ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function parts(step) {
    return {
      join: step.querySelector('.pl-join'),
      letters: Array.prototype.slice.call(step.querySelectorAll('.pl-join span')),
      ex: step.querySelector('.pl-ex'),
      btn: step.querySelector('.pl-play')
    };
  }
  function resetJoin(step) {
    var p = parts(step);
    if (!p.ex.hasAttribute('data-t0')) p.ex.setAttribute('data-t0', p.ex.textContent);
    if (!p.btn.hasAttribute('data-first')) p.btn.setAttribute('data-first', p.btn.textContent);
    p.join.style.transition = 'none';
    p.join.style.gap = '';
    p.letters.forEach(function (l) { l.textContent = l.getAttribute('data-iso'); l.style.color = ''; l.style.margin = ''; l.classList.remove('pl-pop'); });
    void p.join.offsetWidth;
    p.join.style.transition = '';
    p.ex.textContent = p.ex.getAttribute('data-t0');
    p.btn.textContent = p.btn.getAttribute('data-first');
    p.btn.style.visibility = '';
  }
  box.querySelectorAll('.pl-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = btn.closest('.pl-step');
      var p = parts(step);
      clearTimers();
      resetJoin(step);
      btn.style.visibility = 'hidden';
      var t = reduce ? [0, 50, 100] : [500, 3400, 5100];
      timers.push(setTimeout(function () {
        p.letters.forEach(function (l) {
          l.textContent = l.getAttribute('data-con');
          l.classList.remove('pl-pop'); void l.offsetWidth; l.classList.add('pl-pop');
        });
        p.ex.textContent = p.ex.getAttribute('data-t1');
      }, t[0]));
      timers.push(setTimeout(function () {
        p.join.style.gap = '0px';
        p.letters.forEach(function (l) { l.style.margin = '0 -0.5px'; });
        p.ex.textContent = p.ex.getAttribute('data-t2');
      }, t[1]));
      timers.push(setTimeout(function () {
        p.letters.forEach(function (l) { l.style.color = '#0E1B4D'; });
        p.ex.textContent = p.ex.getAttribute('data-t3');
        btn.textContent = btn.getAttribute('data-again');
        btn.style.visibility = '';
      }, t[2]));
    });
  });

  show(0);
})();
