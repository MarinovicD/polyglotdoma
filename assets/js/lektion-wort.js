/* polyglot.doma – Mini-Lektion „Das letzte Wort entscheidet“ (Deutsch, zusammengesetzte Wörter)
   Blättern übernimmt lektion.js. Hier nur:
   0. Vorführen (.pz-demo): Der Artikel des letzten Worts wandert vor das ganze Wort.
   2. Schritt „Riesenwort“: Laufschrift Kraftfahrzeughaftpflicht + die Versicherung (.pz-giant).
   Alle Texte stehen im HTML (Übersetzungen). Bei „Bewegung reduzieren“ nur die Zustände ohne Laufbewegung. */
(function () {
  'use strict';
  var box = document.getElementById('pl-lesson');
  if (!box || !box.querySelector('.pz-giant, .pz-demo')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = Array.prototype.slice.call(box.querySelectorAll('.pl-step'));
  var active = null, timers = [], raf = 0;

  function clear() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); raf = 0; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* Schritt sichtbar geworden? (lektion.js setzt hidden) */
  function check() {
    var s = steps.filter(function (x) { return !x.hidden; })[0] || null;
    if (s === active) return;
    active = s;
    clear();
    if (!s) return;
    if (s.classList.contains('pz-demo')) demo(s);
    else if (s.classList.contains('pz-giantstep')) giant(s);
  }
  var mo = new MutationObserver(check);
  steps.forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ['hidden'] }); });
  check();

  /* ---------- 0. Vorführen: Artikel des letzten Worts wandert vor das ganze Wort ---------- */
  function demo(step) {
    var src = step.querySelector('.pz-src'), dst = step.querySelector('.pz-dst');
    step.classList.remove('pz-on', 'pz-shown');
    step.classList.add('pz-still');
    dst.style.transform = '';
    if (reduce) {
      step.classList.remove('pz-still');
      step.classList.add('pz-on', 'pz-shown');
      return;
    }
    later(function () {
      var a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
      var k = a.width / b.width;
      dst.style.transform = 'translate(' + (a.left - b.left + (a.width - b.width) / 2).toFixed(1) + 'px,' +
        (a.top - b.top + (a.height - b.height) / 2).toFixed(1) + 'px) scale(' + k.toFixed(3) + ')';
      step.classList.add('pz-on');
      void dst.offsetWidth;
      step.classList.remove('pz-still');
      dst.style.transform = '';
    }, 700);
    later(function () { step.classList.add('pz-shown'); }, 1700);
  }

  /* ---------- 2. Riesenwort ---------- */
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   // ein/aus
  function easeRun(t) { return Math.sin(t * Math.PI / 2); }                               // zügig, weich bremsen
  function lin(t) { return t; }
  /* Spur: [[zeit, wert], [zeit, wert, easing], …] */
  function at(track, t) {
    if (t <= track[0][0]) return track[0][1];
    for (var i = 1; i < track.length; i++) {
      var a = track[i - 1], b = track[i];
      if (t <= b[0]) {
        var p = b[0] === a[0] ? 1 : (t - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * (b[2] || ease)(p);
      }
    }
    return track[track.length - 1][1];
  }

  function giant(step) {
    if (!step.pzGiant) step.pzGiant = makeGiant(step);
    step.pzGiant.begin();
  }

  function makeGiant(step) {
    var g = step.querySelector('.pz-giant');
    var world = g.querySelector('.pz-world');
    var pre = world.querySelector('.pz-pre'), plus = world.querySelector('.pz-plus2');
    var die = world.querySelector('.pz-tart'), tail = world.querySelector('.pz-tail'), cap = tail.querySelector('.pz-cap');
    var again = step.querySelector('.pz-again');
    var M, K, END, lastW = 0;

    function measure() {
      [pre, plus, die, tail].forEach(function (e) { e.style.transform = ''; e.style.opacity = ''; });
      cap.textContent = 'V';
      var W = g.clientWidth, H = g.clientHeight;
      var m = { W: W, H: H, wPre: pre.offsetWidth, hW: pre.offsetHeight, wPlus: plus.offsetWidth,
                wDie: die.offsetWidth, hDie: die.offsetHeight, wTailU: tail.offsetWidth };
      cap.textContent = 'v'; m.wTailL = tail.offsetWidth; cap.textContent = 'V';
      /* Breite des sichtbaren Endstücks („…haftpflicht“, sonst „…pflicht“) */
      var probe = document.createElement('span'); probe.className = 'pz-g'; world.appendChild(probe);
      probe.textContent = 'haftpflicht'; var wHaft = probe.offsetWidth;
      probe.textContent = 'pflicht'; var wPfl = probe.offsetWidth;
      world.removeChild(probe);
      var gap = 30, sp = 26;
      m.sp = sp;
      m.xPlus = m.wPre + gap;
      m.xDie = m.xPlus + m.wPlus + gap;
      m.xTail = m.xDie + m.wDie + sp;
      m.yDie = (m.hW - m.hDie) / 2 + m.hW * 0.07;   // Mitte der Kleinbuchstaben, nicht der Zeilenbox
      m.lift = m.hDie * 1.05;
      m.sR = Math.min(96, Math.max(44, W / 6)) / 100;
      var right = m.xTail + m.wTailU;
      m.s2 = Math.min(m.sR, 0.94 * W / (right - m.wPre + wHaft));
      if (m.s2 * 100 < 30) m.s2 = Math.min(m.sR, 0.94 * W / (right - m.wPre + wPfl));
      m.x2 = 0.97 * W - m.s2 * right;
      var p = m.x2 + m.s2 * m.wPre;                // Ende von „…pflicht“ auf dem Bildschirm
      m.x0 = W + 8;
      m.xR = p - m.sR * m.wPre;
      var full = m.wDie + sp + m.wPre + m.wTailL;
      m.s3 = Math.min(m.s2, 0.92 * W / full);
      m.x3 = (W - m.s3 * full) / 2 + m.s3 * (m.wDie + sp);
      m.dieOn = m.wPre + (m.wTailL - m.wDie) / 2;  // über „versicherung“
      m.dieFront = -(m.wDie + sp);
      return m;
    }

    function tracks(m) {
      return {
        cx: [[0, m.x0], [1500, m.xR, easeRun], [1850, m.x2], [4300, m.x2], [5500, m.x3]],
        cy: [[0, .6], [4300, .6], [5500, .8]],
        cs: [[0, m.sR], [1500, m.sR], [1850, m.s2], [4300, m.s2], [5500, m.s3]],
        plusO: [[0, 0], [1750, 0], [1950, 1, lin], [3300, 1], [3500, 0, lin]],
        plusS: [[0, .5], [1750, .5], [1950, 1], [3300, 1], [3500, .5]],
        tailO: [[0, 0], [2000, 0], [2300, 1, lin]],
        tailX: [[0, m.xTail + 40], [2000, m.xTail + 40], [2300, m.xTail], [3400, m.xTail], [3950, m.wPre]],
        dieO: [[0, 0], [2000, 0], [2300, 1, lin]],
        dieX: [[0, m.xDie + 40], [2000, m.xDie + 40], [2300, m.xDie], [3400, m.xDie], [3950, m.dieOn], [4300, m.dieOn], [5300, m.dieFront]],
        dieY: [[0, 0], [3100, 0], [3400, -m.lift], [5150, -m.lift], [5550, 0]]
      };
    }

    function render(t) {
      var s = at(K.cs, t), x = at(K.cx, t);
      var y = M.H * at(K.cy, t) - s * M.hW / 2;
      world.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
      plus.style.opacity = at(K.plusO, t);
      plus.style.transform = 'translateX(' + M.xPlus + 'px) scale(' + at(K.plusS, t).toFixed(3) + ')';
      tail.style.opacity = at(K.tailO, t);
      tail.style.transform = 'translateX(' + at(K.tailX, t).toFixed(2) + 'px)';
      die.style.opacity = at(K.dieO, t);
      die.style.transform = 'translate(' + at(K.dieX, t).toFixed(2) + 'px,' + (M.yDie + at(K.dieY, t)).toFixed(2) + 'px)';
      cap.textContent = t >= 3900 ? 'v' : 'V';
    }

    function done() {
      step.classList.remove('pz-wait');
    }

    function start() {
      clear();
      step.classList.add('pz-wait');
      cap.classList.remove('pz-flash');
      M = measure(); K = tracks(M); END = 5550; lastW = M.W;
      g.classList.add('pz-ready');
      if (reduce) {
        /* Zustände ohne Laufbewegung: nebeneinander → angedockt → ganzes Wort */
        var shots = [3100, 4300, END];
        world.style.transition = 'opacity .25s';
        render(shots[0]);
        shots.slice(1).forEach(function (t, i) {
          later(function () { world.style.opacity = 0; }, 1500 * (i + 1));
          later(function () { render(t); world.style.opacity = 1; }, 1500 * (i + 1) + 260);
        });
        later(done, 1500 * shots.length);
        return;
      }
      var t0 = null, flashed = false;
      function frame(now) {
        if (t0 === null) t0 = now;
        var t = now - t0;
        render(Math.min(t, END));
        if (!flashed && t >= 3900) {
          flashed = true; cap.classList.add('pz-flash');
          later(function () { cap.classList.remove('pz-flash'); }, 60);
        }
        if (t < END) raf = requestAnimationFrame(frame);
        else { raf = 0; done(); }
      }
      raf = requestAnimationFrame(frame);
    }

    function begin() {
      clear();
      step.classList.add('pz-wait');
      g.classList.remove('pz-ready');
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      ready.then(function () { if (active === step) start(); });
    }
    again.addEventListener('click', function () { if (active === step) begin(); });
    window.addEventListener('resize', function () {
      if (active !== step || !M || g.clientWidth === lastW) return;
      if (step.classList.contains('pz-wait')) { begin(); return; }
      M = measure(); K = tracks(M); lastW = M.W; render(END);
    });
    return { begin: begin };
  }
})();
