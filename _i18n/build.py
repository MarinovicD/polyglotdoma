#!/usr/bin/env python3
"""polyglot.doma – baut die Sprachfassungen der Website.

Quelle ist immer die deutsche Fassung im Hauptordner (index.html, impressum.html,
datenschutz.html). Aufruf im Repo-Hauptordner:  python3 _i18n/build.py

Ergebnis: en/, bs/, ar/ mit index.html, impressum.html, datenschutz.html.
Außerdem werden Sprachumschalter (und, sobald BASE_URL gesetzt ist, hreflang-Links)
in die deutschen Seiten geschrieben. Die erzeugten Dateien nicht von Hand ändern.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from index_strings import S, AR_EXTRA
from legal_strings import UI, IMPRESSUM, DATENSCHUTZ
from arabisch_strings import A
from bosnisch_strings import B

# Vollständige Adresse der Website mit / am Ende, z. B. 'https://polyglotdoma.com/'.
# Solange leer, werden keine hreflang-Links gesetzt (Google verlangt absolute Adressen).
BASE_URL = 'https://polyglotdoma.com/'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['de', 'en', 'bs', 'ar']
NAMES = {'de': 'Deutsch', 'en': 'English', 'bs': 'Bosanski', 'ar': 'العربية'}
SW_LABEL = {'de': 'Sprache der Website', 'en': 'Website language', 'bs': 'Jezik stranice', 'ar': 'لغة الموقع'}
COL = {'de': 0, 'en': 1, 'bs': 2, 'ar': 3}
# Fahnen-Icons (assets/img/flags/, eingebunden über style.css): Englisch = USA/GB geteilt, Arabisch = Arabische Liga
FLAG = {'de': 'de', 'en': 'en', 'bs': 'ba', 'ar': 'ar'}

def rel(from_lang, to_lang, page):
    """Relativer Link von einer Seite in from_lang zur gleichen Seite in to_lang."""
    up = '' if from_lang == 'de' else '../'
    sub = '' if to_lang == 'de' else to_lang + '/'
    target = up + sub
    if page != 'index.html':
        target += page
    return target or './'

PILL_ON = 'text-decoration: none; color: #F4F6FB; background: #0E1B4D; border-radius: 999px; padding: 6px 10px'
PILL_OFF = 'text-decoration: none; color: #0E1B4D; border: 1.5px solid #0E1B4D; border-radius: 999px; padding: 4.5px 9px'

def switcher(lang, page):
    a = []
    for l in LANGS:
        cur = ' aria-current="page"' if l == lang else ''
        a.append('<a href="%s" hreflang="%s" lang="%s" title="%s" data-flag="%s"%s style="%s">%s</a>' % (
            rel(lang, l, page), l, l, NAMES[l], FLAG[l], cur, PILL_ON if l == lang else PILL_OFF, l.upper()))
    return ('<span class="pd-switch" role="group" aria-label="%s" style="display: flex; gap: 4px; font-size: 13px; '
            'font-weight: 700; letter-spacing: 0.06em; direction: ltr">%s</span>') % (SW_LABEL[lang], ''.join(a))

def menu_switcher(lang, page):
    a = []
    for l in LANGS:
        cur = ' aria-current="page"' if l == lang else ''
        a.append('<a href="%s" hreflang="%s" lang="%s" data-flag="%s"%s style="%s">%s</a>' % (
            rel(lang, l, page), l, l, FLAG[l], cur, PILL_ON if l == lang else PILL_OFF, NAMES[l]))
    return ('<span role="group" aria-label="%s" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 15px; '
            'font-weight: 700; padding: 12px 14px 8px; border-top: 1.5px dashed #9FB3E3; margin-top: 6px">%s</span>') % (
            SW_LABEL[lang], ''.join(a))

def alternates(lang, page):
    if not BASE_URL:
        return ''
    out = []
    for l in LANGS:
        path = ('' if l == 'de' else l + '/') + ('' if page == 'index.html' else page)
        out.append('<link rel="alternate" hreflang="%s" href="%s%s">' % (l, BASE_URL, path))
    out.append('<link rel="alternate" hreflang="x-default" href="%s%s">' % (BASE_URL, '' if page == 'index.html' else page))
    return '\n'.join(out)

def fill(html, marker, content):
    pat = re.compile(r'<!--%s-->.*?<!--/%s-->' % (marker, marker), re.S)
    if not pat.search(html):
        return html
    return pat.sub(lambda m: '<!--%s-->%s<!--/%s-->' % (marker, content, marker), html)

def fill_all(html, lang, page):
    html = fill(html, 'LANGSW', switcher(lang, page))
    html = fill(html, 'LANGMENU', menu_switcher(lang, page))
    html = fill(html, 'ALT', alternates(lang, page))
    return html

def to_subdir(html, lang):
    html = html.replace('<html lang="de">', '<html lang="%s"%s>' % (lang, ' dir="rtl"' if lang == 'ar' else ''), 1)
    # Links auf die Arabisch-Seite bleiben relativ: /en/ → /en/arabisch/, /bs/ → /bs/arabisch/
    # (die AR-Startseite hat keine solchen Links, siehe NOAR)
    for a in ('href="assets/', 'src="assets/', 'poster="assets/', 'href="favicon.svg"'):
        html = html.replace(a, a.replace('="', '="../', 1))
    return html

def text_nodes(html):
    body = re.split(r'<body[^>]*>', html, maxsplit=1)[1]
    body = re.sub(r'<svg.*?</svg>', '', body, flags=re.S)
    return set(t.strip() for t in re.findall(r'>([^<>]+)<', body) if re.search(r'[A-Za-zÄÖÜäöüß]{3}', t))

ALLOW = {'polyglot', 'doma', 'Domagoj', 'FAQ', 'Kontakt', 'DE', 'EN', 'BS', 'AR', 'Deutsch', 'English', 'Bosanski',
         'Domagoj Marinović', 'Google Drive', 'Web3Forms.', 'Google', 'docs.github.com', 'web3forms.com',
         'policies.google.com', 'info@talaqa-lab.com', 'Matina bb', '72230 Žepče', 'polyglot.doma', '© 2026 polyglot.doma', '03 — FAQ'}

def build_index():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    de = fill_all(src, 'de', 'index.html')
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(de)
    de_text = text_nodes(de)
    pairs = sorted(S, key=lambda r: -len(r[0]))
    missing = [r[0] for r in pairs if r[0] not in src]
    if missing:
        sys.exit('Nicht in index.html gefunden:\n  ' + '\n  '.join(m[:90] for m in missing))
    for lang in ('en', 'bs', 'ar'):
        out = src
        if lang == 'ar':
            # Arabische Fassung: keine Hinweise auf die Arabisch-Seite (Entscheidung 07.11.2026)
            out = re.sub(r'<!--NOAR-->.*?<!--/NOAR-->', '', out, flags=re.S)
            out = re.sub(r'<!--AR:(.*?)-->', r'\1', out)
        for row in pairs:
            out = out.replace(row[0], row[COL[lang]])
        if lang == 'ar':
            for a, b in AR_EXTRA:
                if a not in out:
                    sys.exit('AR_EXTRA nicht gefunden: ' + a[:80])
                out = out.replace(a, b)
            out = out.replace('pd-left', 'pd-TMP').replace('pd-right', 'pd-left').replace('pd-TMP', 'pd-right')
        if lang in AR_SLUG:
            out = out.replace('href="arabisch/', 'href="%s/' % AR_SLUG[lang])
        if lang == 'bs':
            # Bosnische Fassung: kein Link auf die Bosnisch-Seite (die gibt es nicht auf Bosnisch)
            out = re.sub(r'<!--NOBS-->.*?<!--/NOBS-->', '', out, flags=re.S)
            out = re.sub(r'<!--BS:(.*?)-->', r'\1', out)
        if lang in BS_SLUG:
            out = out.replace('href="bosnisch/', 'href="%s/' % BS_SLUG[lang])
        out = to_subdir(out, lang)
        out = fill_all(out, lang, 'index.html')
        left = sorted(t for t in text_nodes(out) & de_text if t not in ALLOW)
        if left:
            print('[%s] noch deutsch?' % lang, left)
        os.makedirs(os.path.join(ROOT, lang), exist_ok=True)
        open(os.path.join(ROOT, lang, 'index.html'), 'w', encoding='utf-8').write(out)
        print('%s/index.html geschrieben' % lang)

def build_legal(page, bodies, title_key):
    src = open(os.path.join(ROOT, page), encoding='utf-8').read()
    open(os.path.join(ROOT, page), 'w', encoding='utf-8').write(fill_all(src, 'de', page))
    head, rest = src.split('<main class="pd-legal">', 1)
    for lang in ('en', 'bs', 'ar'):
        ui = UI[lang]
        h = to_subdir(head, lang)
        h = re.sub(r'<title>.*?</title>', '<title>%s – polyglot.doma</title>' % ui[title_key], h)
        h = h.replace('>← Zur Startseite</a>', '>%s</a>' % ui['back'])
        h = h.replace('<span style="font-size: 24px', '<span dir="ltr" style="font-size: 24px', 1)
        h = fill_all(h, lang, page)
        main = ('<main class="pd-legal">\n<div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; '
                'border-top: 1.5px solid #0E1B4D; padding-top: 12px">%s</div>\n<h1>%s</h1>\n<p class="pd-note">%s</p>\n%s\n</main>\n'
                '</body>\n</html>\n') % (ui['legal'], ui[title_key], ui['note'].format(page=page), bodies[lang])
        open(os.path.join(ROOT, lang, page), 'w', encoding='utf-8').write(h + main)
        print('%s/%s geschrieben' % (lang, page))

# ---------- Sprachseiten (eigene Seite je Lehrsprache, z. B. arabisch/, bosnisch/) ----------
# Arabisch-Seite: DE, EN, BS. Bosnisch-Seite: DE, EN, AR (keine bosnische Fassung, Entscheidung 07.11.2026).
AR_PAGE_LANGS = ['de', 'en', 'bs']
BS_PAGE_LANGS = ['de', 'en', 'ar']
# Ordnernamen je Sprache in der Sprache der Fassung (Regel seit 07.11.2026); Arabisch mit lateinischer
# Umschrift aus dem Englischen, weil arabische Schrift in Adressen zu %-Zeichenketten wird.
AR_SLUG = {'de': 'arabisch', 'en': 'arabic', 'bs': 'arapski'}

def slug_of(slug, lang):
    """slug: ein Ordnername für alle Sprachen oder ein dict je Sprache (z. B. bosnisch → /en/bosnian/)."""
    return slug[lang] if isinstance(slug, dict) else slug

def page_href(slug, from_lang, to_lang):
    return ('../' if from_lang == 'de' else '../../') + ('' if to_lang == 'de' else to_lang + '/') + slug_of(slug, to_lang) + '/'

def page_switchers(html, slug, langs, lang):
    a, m = [], []
    for l in langs:
        cur = ' aria-current="page"' if l == lang else ''
        st = PILL_ON if l == lang else PILL_OFF
        a.append('<a href="%s" hreflang="%s" lang="%s" title="%s" data-flag="%s"%s style="%s">%s</a>' % (page_href(slug, lang, l), l, l, NAMES[l], FLAG[l], cur, st, l.upper()))
        m.append('<a href="%s" hreflang="%s" lang="%s" data-flag="%s"%s style="%s">%s</a>' % (page_href(slug, lang, l), l, l, FLAG[l], cur, st, NAMES[l]))
    sw = ('<span class="pd-switch" role="group" aria-label="%s" style="display: flex; gap: 4px; font-size: 13px; '
          'font-weight: 700; letter-spacing: 0.06em; direction: ltr">%s</span>') % (SW_LABEL[lang], ''.join(a))
    mn = ('<span role="group" aria-label="%s" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 15px; '
          'font-weight: 700; padding: 12px 14px 8px; border-top: 1.5px dashed #9FB3E3; margin-top: 6px">%s</span>') % (SW_LABEL[lang], ''.join(m))
    alt = ''
    if BASE_URL:
        alt = '\n'.join('<link rel="alternate" hreflang="%s" href="%s%s%s/">' % (l, BASE_URL, '' if l == 'de' else l + '/', slug_of(slug, l)) for l in langs)
    html = fill(html, 'LANGSW', sw)
    html = fill(html, 'LANGMENU', mn)
    return fill(html, 'ALT', alt)

def shared_rows(extra=()):
    """Gemeinsame Texte aus der Startseite (Formular, FAQ); bei mehrteiligen Antworten auch einzelne Absätze.
    extra: weitere Zeilen im Format (DE, EN, BS) aus anderen Sprachseiten."""
    shared = []
    for r in S:
        shared.append(r)
        if 'href="datenschutz.html"' in r[0]:
            shared.append(tuple(x.replace('href="datenschutz.html"', 'href="../datenschutz.html"') for x in r))
        if r[0].startswith('<p>') and '</p><p>' in r[0]:
            parts = [x.split('</p><p>') for x in r]
            if all(len(p) == len(parts[0]) for p in parts):
                shared.append(tuple(p[0] + '</p>' for p in parts))
    return shared

def build_page(slug, rows, langs, extra=()):
    """rows: Zeilen (DE, ...) in der Reihenfolge von langs. extra: Zeilen (DE, EN, BS) einer anderen Sprachseite,
    die nach den eigenen Zeilen, aber vor den Startseiten-Texten angewendet werden."""
    path = os.path.join(ROOT, slug_of(slug, 'de'), 'index.html')
    src = open(path, encoding='utf-8').read()
    de = page_switchers(src, slug, langs, 'de')
    open(path, 'w', encoding='utf-8').write(de)
    missing = [r[0] for r in rows if r[0] not in src]
    if missing:
        sys.exit('Nicht in %s/index.html gefunden:\n  ' % slug_of(slug, 'de') + '\n  '.join(m[:90] for m in missing))
    shared = shared_rows()
    de_text = text_nodes(de)
    for lang in langs[1:]:
        out = src
        for row in sorted(rows, key=lambda r: -len(r[0])):
            out = out.replace(row[0], row[langs.index(lang)])
        if lang in AR_PAGE_LANGS:
            for row in sorted(extra, key=lambda r: -len(r[0])):
                out = out.replace(row[0], row[AR_PAGE_LANGS.index(lang)])
        for row in sorted(shared, key=lambda r: -len(r[0])):
            out = out.replace(row[0], row[COL[lang]])
        out = out.replace('<html lang="de">', '<html lang="%s"%s>' % (lang, ' dir="rtl"' if lang == 'ar' else ''), 1)
        for a in ('href="../assets/', 'src="../assets/', 'href="../favicon.svg"'):
            out = out.replace(a, a.replace('="../', '="../../', 1))
        out = page_switchers(out, slug, langs, lang)
        left = sorted(t for t in text_nodes(out) & de_text if t not in ALLOW)
        if left:
            print('[%s/%s] noch deutsch?' % (lang, slug_of(slug, lang)), left)
        os.makedirs(os.path.join(ROOT, lang, slug_of(slug, lang)), exist_ok=True)
        open(os.path.join(ROOT, lang, slug_of(slug, lang), 'index.html'), 'w', encoding='utf-8').write(out)
        print('%s/%s/index.html geschrieben' % (lang, slug_of(slug, lang)))

def build_arabisch():
    build_page(AR_SLUG, A, AR_PAGE_LANGS)

BS_SLUG = {'de': 'bosnisch', 'en': 'bosnian', 'ar': 'bosnian'}

# Alte Adressen, die auf die neue Adresse weiterleiten (GitHub Pages kann kein 301, daher eine kleine Weiterleitungsseite)
REDIRECTS = [('en/bosnisch', '../bosnian/'), ('en/arabisch', '../arabic/'), ('bs/arabisch', '../arapski/')]

def build_redirects():
    for d, target in REDIRECTS:
        os.makedirs(os.path.join(ROOT, d), exist_ok=True)
        html = ('<!doctype html>\n<html><head><meta charset="utf-8"><meta name="robots" content="noindex">'
                '<link rel="canonical" href="%s%s"><meta http-equiv="refresh" content="0; url=%s">'
                '<title>polyglot.doma</title></head><body><a href="%s">polyglot.doma</a></body></html>\n') % (
                BASE_URL, os.path.normpath(os.path.join(d, target)) + '/', target, target)
        open(os.path.join(ROOT, d, 'index.html'), 'w', encoding='utf-8').write(html)
        print('%s/index.html (Weiterleitung) geschrieben' % d)

def build_bosnisch():
    build_page(BS_SLUG, B, BS_PAGE_LANGS, extra=A)

if __name__ == '__main__':
    build_index()
    build_arabisch()
    build_bosnisch()
    build_redirects()
    build_legal('impressum.html', IMPRESSUM, 'impressum')
    build_legal('datenschutz.html', DATENSCHUTZ, 'datenschutz')
