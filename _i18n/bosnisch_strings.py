# polyglot.doma – Übersetzungen der Bosnisch-Seite (bosnisch/index.html)
# Jede Zeile: (Deutsch-Quelltext inkl. etwas HTML-Kontext, English)
# Die Bosnisch-Seite gibt es nicht auf Bosnisch (Entscheidung 07.11.2026). Englisch freigegeben am 07.11.2026.
# Texte, die auch auf der Startseite oder der Arabisch-Seite stehen (Menü, Formular, Lektions-Knöpfe),
# kommen aus index_strings.S bzw. arabisch_strings.A.

SER = '<span class="serif" style="color: #1D3A9A; letter-spacing: -0.01em">'

B = [
# ---------- Kopf / Meta ----------
('<title>Bosnisch lernen – polyglot.doma</title>', '<title>Learn Bosnian – polyglot.doma</title>'),
('content="Bosnisch lernen mit Domagoj. Mini-Lektion: Erkenne in zwei Minuten das Geschlecht bosnischer Wörter."',
 'content="Learn Bosnian with Domagoj. Mini-lesson: learn to recognise the gender of Bosnian words in two minutes."'),
('content="Bosnisch lernen – polyglot.doma"', 'content="Learn Bosnian – polyglot.doma"'),
('content="Der, die, das? Im Bosnischen verrät es dir das Wort selbst."', 'content="He, she or it? In Bosnian, the word itself tells you."'),
('><span class="pd-eyebrow"><span>Sprachunterricht</span><span>Bosnisch</span></span></div>', '><span class="pd-eyebrow"><span>Language lessons</span><span>Bosnian</span></span></div>'),

# ---------- Lektion: Kopf ----------
('<span>01 — Ausprobieren</span><span>Mini-Lektion · 2 Minuten</span>', '<span>01 — Try it</span><span>Mini-lesson · 2 minutes</span>'),
('>Der, die, das? ' + SER + 'Das Wort verrät es dir.</span></h2>', '>He, she or it? ' + SER + 'The word tells you.</span></h2>'),
('>Im Bosnischen gibt es keine Artikel. Trotzdem hat jedes Wort ein Geschlecht, und meistens siehst du es ihm sofort an. In zwei Minuten erkennst du es selbst.</p>',
 ">In English, things have no gender. In Bosnian they do, but most of the time you can see it at a glance. In two minutes, you'll spot it yourself.</p>"),
('aria-label="Mini-Lektion: das Geschlecht im Bosnischen" data-ok="Richtig: {w} ist {g}." data-no="Nicht ganz: {w} ist {g}."',
 'aria-label="Mini-lesson: gender in Bosnian" data-ok="Right: {w} is {g}." data-no="Not quite: {w} is {g}."'),

# ---------- Lektion: Schritte ----------
('>Im Bosnischen gibt es kein <b>der, die, das</b>. Trotzdem ist jedes Nomen <b>männlich</b>, <b>weiblich</b> oder <b>neutral</b>.</p>',
 '>In English, a city is simply “it”. In Bosnian, every noun is <b>masculine</b>, <b>feminine</b> or <b>neuter</b>.</p>'),
('>Auswendig lernen musst du das aber nicht. Rate bei den nächsten drei Wörtern einfach mal, ganz ohne Vorwissen.</p>',
 ">But you don't have to memorise it. Just take a guess with the next three words, no prior knowledge needed.</p>"),
('>Rate mal: Was ist <b>grad</b>?</p>', '>Take a guess: what is <b>grad</b>?</p>'),
('>Und was ist <b>rijeka</b>?</p>', '>And <b>rijeka</b>?</p>'),
('>Und <b>selo</b>?</p>', '>And <b>selo</b>?</p>'),
('>Fällt dir etwas auf? Schau auf den <b>letzten Buchstaben</b>.</p>', '>Notice something? Look at the <b>last letter</b>.</p>'),
('>endet auf <b>Konsonant</b></span>', '>ends in a <b>consonant</b></span>'),
('>endet auf <b>-a</b></span>', '>ends in <b>-a</b></span>'),
('>endet auf <b>-o</b> oder <b>-e</b></span>', '>ends in <b>-o</b> or <b>-e</b></span>'),
('>Jetzt du. <b>Acht Wörter</b>, schau nur aufs Ende.</p>', '>Your turn. <b>Eight words</b>, just look at the ending.</p>'),
('data-done="{n} von {t} auf Anhieb richtig."', 'data-done="{n} out of {t} right on the first try."'),
('class="pg-again">Nochmal</button>', 'class="pg-again">Again</button>'),
('data-g="m">männlich</', 'data-g="m">masculine</'),
('data-g="f">weiblich</', 'data-g="f">feminine</'),
('data-g="n">neutral</', 'data-g="n">neuter</'),
('serif">Stadt</span>', 'serif">city</span>'),
('serif">Fluss</span>', 'serif">river</span>'),
('serif">Dorf</span>', 'serif">village</span>'),
('serif">Brücke</span>', 'serif">bridge</span>'),
('serif">Berg</span>', 'serif">mountain</span>'),
('serif">Sonne</span>', 'serif">sun</span>'),
('serif">Weg</span>', 'serif">road</span>'),
('serif">Haus</span>', 'serif">house</span>'),
('serif">See</span>', 'serif">lake</span>'),
('serif">Tee</span>', 'serif">tea</span>'),
('serif">Meer</span>', 'serif">sea</span>'),
('serif">Morgen</span>', 'serif">morning</span>'),
('serif">Guten Tag</span>', 'serif">Good day</span>'),
('serif">guter Kaffee</span>', 'serif">good coffee</span>'),
('><b>dobar</b> heißt „gut“. Es richtet sich nach dem <b>Geschlecht</b> des Wortes, das es beschreibt.</p>',
 '><b>dobar</b> means “good”. It follows the <b>gender</b> of the word it describes.</p>'),
('><b>dan</b> ist männlich</span>', '><b>dan</b> is masculine</span>'),
('><b>kafa</b> ist weiblich</span>', '><b>kafa</b> is feminine</span>'),
('><b>jutro</b> heißt „Morgen“. Wie sagst du <b>Guten Morgen</b>?</p>', '><b>jutro</b> means “morning”. How do you say <b>good morning</b>?</p>'),
('data-fb="dobar passt zu männlichen Wörtern. jutro ist neutral."', 'data-fb="dobar goes with masculine words. jutro is neuter."'),
('data-fb="dobra passt zu weiblichen Wörtern. jutro ist neutral."', 'data-fb="dobra goes with feminine words. jutro is neuter."'),
('data-fb="Genau: jutro ist neutral, also dobro jutro."', 'data-fb="Exactly: jutro is neuter, so dobro jutro."'),
('>Jetzt weißt du, warum man <b>dobar dan</b> sagt, aber <b>dobro jutro</b>: <b>dan</b> ist männlich, <b>jutro</b> ist neutral.</p>',
 ">Now you know why it's <b>dobar dan</b> but <b>dobro jutro</b>: <b>dan</b> is masculine, <b>jutro</b> is neuter.</p>"),
('>Und bei fast jedem neuen Wort erkennst du ab sofort selbst, ob es männlich, weiblich oder neutral ist. Im Unterricht baust du genau darauf auf, Schritt für Schritt.</p>',
 ">And from now on, you can tell for almost any new word whether it's masculine, feminine or neuter. In lessons, you build on exactly that, step by step.</p>"),
('>Wie fast jede Regel hat auch diese ein paar Ausnahmen.</p>', '>Like almost every rule, this one has a few exceptions.</p>'),

# ---------- Kontakt ----------
('>Bereit für die nächsten Wörter?</span>', '>Ready for your next words?</span>'),
('>Schreib mir, wo du mit deinem Bosnisch gerade stehst und was dein Ziel ist. Ich melde mich persönlich bei dir und wir vereinbaren ein Kennenlerngespräch.</p>',
 ">Write to me where you currently stand with your Bosnian and what your goal is. I'll get back to you personally and we'll arrange an intro call.</p>"),
]
