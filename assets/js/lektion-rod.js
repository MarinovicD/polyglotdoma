/* polyglot.doma – Mini-Lektion „Der, die, das? Das Wort verrät es dir.“ (Bosnisch, Geschlecht der Nomen)
   Blättern und Quiz übernimmt lektion.js. Hier nur die Wortkarten (.pg-deck): raten, auflösen, Runde zählen.
   Alle Texte stehen im HTML (für Übersetzungen): Rückmeldungen als data-ok / data-no / data-done, {w} = Wort,
   {g} = Geschlecht (Text des Buttons), {n}/{t} = Treffer/gesamt. */
(function () {
  'use strict';
  var box = document.getElementById('pl-lesson');
  if (!box || !box.querySelector('.pg-deck')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tOk = box.getAttribute('data-ok'), tNo = box.getAttribute('data-no');
  var ar = document.documentElement.lang === 'ar';
  function num(n) { return ar ? String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(n); }

  function fill(t, map) { return t.replace(/\{(\w)\}/g, function (_, k) { return map[k]; }); }

  box.querySelectorAll('.pg-deck').forEach(function (deck) {
    var items = Array.prototype.slice.call(deck.querySelectorAll('.pg-item'));
    var picks = Array.prototype.slice.call(deck.querySelectorAll('.pg-pick'));
    var pickBox = deck.querySelector('.pg-picks');
    var fb = deck.querySelector('.pl-fb');
    var sum = deck.querySelector('.pg-sum');
    var round = deck.classList.contains('pg-round');
    var cur = 0, hits = 0, locked = false, timer = null;

    function label(g) { for (var i = 0; i < picks.length; i++) if (picks[i].getAttribute('data-g') === g) return picks[i].textContent; return g; }

    function showItem(i) {
      cur = i; locked = false;
      items.forEach(function (it, j) {
        it.hidden = j !== i;
        it.classList.remove('pg-done');
        it.classList.toggle('pl-pop', j === i && round);
      });
      picks.forEach(function (b) { b.classList.remove('ok', 'no'); b.disabled = false; });
      fb.textContent = ''; fb.className = 'pl-fb';
      if (sum) sum.hidden = true;
      pickBox.hidden = false;
      deck.setAttribute('data-pos', num(i + 1) + ' / ' + num(items.length));
    }

    function reset() { clearTimeout(timer); hits = 0; showItem(0); }

    function finish() {
      items.forEach(function (it) { it.hidden = true; });
      pickBox.hidden = true;
      fb.textContent = ''; fb.className = 'pl-fb';
      sum.hidden = false;
      sum.querySelector('.pg-score').textContent = fill(deck.getAttribute('data-done'), { n: num(hits), t: num(items.length) });
      deck.removeAttribute('data-pos');
    }

    picks.forEach(function (b) {
      b.addEventListener('click', function () {
        if (locked) return;
        locked = true;
        var it = items[cur], g = it.getAttribute('data-g');
        var right = b.getAttribute('data-g') === g;
        if (right) hits++;
        picks.forEach(function (o) {
          o.disabled = true;
          if (o.getAttribute('data-g') === g) o.classList.add('ok');
        });
        if (!right) b.classList.add('no');
        it.classList.add('pg-done');
        var word = it.querySelector('.pg-w').textContent;
        var msg = fill(right ? tOk : tNo, { w: word, g: label(g) });
        var note = it.getAttribute('data-note');
        fb.textContent = msg + (note ? ' ' + note : '');
        fb.className = 'pl-fb ' + (right ? 'ok' : 'no');
        if (round) {
          var wait = reduce ? 900 : (note || !right ? 2600 : 1300);
          timer = setTimeout(function () { cur + 1 < items.length ? showItem(cur + 1) : finish(); }, wait);
        }
      });
    });

    if (sum) sum.querySelector('.pg-again').addEventListener('click', reset);
    box.querySelectorAll('.pl-restart').forEach(function (r) { r.addEventListener('click', reset); });
    showItem(0);
  });
})();
