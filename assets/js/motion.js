/* polyglot.doma – Scroll-Animationen
   Läuft in allen Browsern, auch in Safari ohne CSS-Scroll-Timelines (Prüfung per
   requestAnimationFrame beim Scrollen). Kein Markup nötig: die Ziele werden hier per Selektor gesucht, damit
   die Übersetzungsdateien unberührt bleiben. Bei „Bewegung reduzieren“ passiert nichts. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.requestAnimationFrame) return;

  var rtl = root.dir === 'rtl';
  var scope = Array.prototype.slice.call(document.querySelectorAll('main section:not(#top), main .pd-section'));
  if (!scope.length) scope = Array.prototype.slice.call(document.querySelectorAll('section:not(#top)'));
  function all(sel) {
    var out = [];
    scope.forEach(function (s) { out = out.concat(Array.prototype.slice.call(s.querySelectorAll(sel))); });
    return out;
  }
  function mark(el, type) {
    if (!el || el.hasAttribute('data-r')) return;
    if (el.closest('[data-r]') || el.closest('dialog') || el.closest('.pl-stage')) return;
    el.setAttribute('data-r', type);
  }

  /* 1) Überschriften: Wort für Wort */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          if (parts.length < 2 && !n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('span');
            w.className = 'pd-wd'; w.style.setProperty('--i', i++); w.textContent = p;
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(SVG|BR)$/i.test(n.tagName) && !n.classList.contains('sr-only')) {
          walk(n);
        }
      });
    })(el);
  }
  all('h2').forEach(function (h) { if (h.closest('[data-r]')) return; splitWords(h); mark(h, 'words'); });

  /* 2) Rubrikzeilen („01 — Über mich“): Linie zeichnet sich */
  all('div[style*="text-transform: uppercase"][style*="border-top"]').forEach(function (d) { mark(d, 'rule'); });

  /* 3) Karten und Listen: gestaffelt von unten */
  all('.pd-card, .pd-offer, .pl-way, .pd-teaser, .pd-faq, .pd-formcard, .pl-lesson').forEach(function (c) { mark(c, 'up'); });
  all('.pd-lang.pd-left').forEach(function (c) { mark(c, rtl ? 'right' : 'left'); });
  all('.pd-lang.pd-right').forEach(function (c) { mark(c, rtl ? 'left' : 'right'); });
  all('#kontakt ol > li').forEach(function (c) { mark(c, rtl ? 'right' : 'left'); });

  /* 4) Bilder, Video, Zeichnungen */
  all('figure, .pd-zoom').forEach(function (c) { mark(c, 'zoom'); });
  all('.pd-pop').forEach(function (c) { mark(c, 'pop'); });

  /* 5) Übrige Bausteine mit bisheriger Reveal-Klasse, Absätze und Buttons */
  all('.pd-reveal, .pd-left, .pd-right').forEach(function (c) { mark(c, 'up'); });
  all('p, .pd-btn, .pd-hint-link, ul:not(.pd-langs) > li').forEach(function (c) { mark(c, 'fade'); });

  /* Staffelung unter Geschwistern */
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-r]'));
  targets.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (s) { return s.hasAttribute('data-r'); });
    var k = sibs.indexOf(el);
    if (k > 0) el.style.setProperty('--d', Math.min(k, 6) * 0.09 + 's');
  });

  /* Sichtbarkeit direkt über die Position prüfen (robuster als IntersectionObserver: zählt auch
     zugeklappte Elemente wie die Rubrik-Linien und verpasst beim schnellen Scrollen nichts) */
  var pending = targets.slice();
  function reveal(vh) {
    if (!pending.length) return;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.88 || r.bottom < 0) {
        el.classList.add('is-in');
        /* danach keine Verzögerung mehr, damit Hover-Effekte sofort reagieren */
        setTimeout(function () { el.style.removeProperty('--d'); }, 1800);
        return false;
      }
      return true;
    });
  }
  root.classList.add('js-motion-ready');

  /* ---------- Scroll-gekoppelte Effekte (Parallaxe, Sonne, Route, Kopfzeile) ----------
     Wo der Browser CSS-Scroll-Timelines kann, laufen Kopfzeile/Fortschritt/Route schon per CSS;
     Parallaxe und Sonne übernimmt immer dieses Skript (einheitlich auf allen Geräten). */
  var cssTL = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  var par = Array.prototype.slice.call(document.querySelectorAll('.pd-par'));
  var deco = all('svg[aria-hidden="true"][style*="position: absolute"][style*="top:"]').filter(function (s) {
    return !/inset: 0/.test(s.getAttribute('style')) && !s.closest('.pd-map') && s.getBoundingClientRect().width < 400;
  });
  var suns = Array.prototype.slice.call(document.querySelectorAll('.pd-sun'));
  var head = document.querySelector('.pd-head');
  var prog = document.querySelector('.pd-prog');
  var map = document.querySelector('.pd-map');
  var cover = document.querySelector('.pd-route-cover');
  var vh = window.innerHeight, ticking = false;

  function progress(el) {           /* 0 = Element kommt unten rein, 1 = oben raus */
    var r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
  }
  function frame() {
    ticking = false;
    reveal(vh);
    par.forEach(function (el) { el.style.transform = 'translateY(' + (60 - 120 * progress(el)).toFixed(1) + 'px)'; });
    deco.forEach(function (el) { el.style.transform = 'translateY(' + (40 - 80 * progress(el)).toFixed(1) + 'px)'; });
    suns.forEach(function (el) {
      var svg = el.ownerSVGElement || el;
      var p = Math.min(1, progress(svg) / 0.55);
      el.style.transform = 'translateY(' + (140 * (1 - p)).toFixed(1) + 'px)';
    });
    if (!cssTL) {
      var y = window.scrollY || window.pageYOffset;
      if (head) head.style.boxShadow = '0 10px 30px -18px rgba(14,27,77,' + (0.55 * Math.min(1, y / 160)).toFixed(3) + ')';
      if (prog) { var max = document.documentElement.scrollHeight - vh; prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')'; }
      if (map && cover) {
        var r = map.getBoundingClientRect();
        var p2 = (vh - r.top) / (vh + r.height);
        p2 = Math.max(0, Math.min(1, (p2 - 0.12) / 0.76));
        cover.style.strokeDashoffset = (-p2).toFixed(4);
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  if (!cssTL) root.classList.add('js-scrub');
  frame();
})();
