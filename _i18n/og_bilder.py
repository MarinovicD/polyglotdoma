"""Vorschaubilder (og:image) für alle Sitemap-Seiten erzeugen: lokalen Server auf Port 8765 starten, dann python3 _i18n/og_bilder.py. Schreibt assets/img/og/<adresse>.png."""
damit Schriften und SVG-Defs der Hero-Zeichnung verfügbar sind."""
from playwright.sync_api import sync_playwright

LOGO = '''<svg viewBox="0 0 200 200" width="64" height="64"><defs><clipPath id="ogw"><rect x="0" y="110" width="200" height="13"/><rect x="0" y="129" width="200" height="9"/><rect x="0" y="144" width="200" height="6"/></clipPath></defs><path d="M16 104 L70 50 L88 68 L114 34 L184 104 Z" fill="#1D3A9A"/><path d="M114 34 L104 48 L110 45 L115 51 L120 45 L125 49 Z" fill="#F4F6FB"/><path d="M16 104 L70 158 L88 140 L114 174 L184 104 Z" fill="#4A68C2" clip-path="url(#ogw)"/><circle cx="152" cy="40" r="12" fill="#B88A4A"/></svg>'''

# Startseite: großer Berg mit Spiegelung im Kobalt-Kreis, Messing-Sonne
START_ART = '''<svg viewBox="0 0 520 520" width="460" height="460">
<defs>
 <clipPath id="ogc"><circle cx="260" cy="260" r="250"/></clipPath>
 <clipPath id="ogw2"><rect x="0" y="300" width="520" height="30"/><rect x="0" y="344" width="520" height="22"/><rect x="0" y="380" width="520" height="15"/><rect x="0" y="408" width="520" height="9"/></clipPath>
 <pattern id="ogdot" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#9FB3E3"/></pattern>
</defs>
<circle cx="260" cy="260" r="250" fill="#1D3A9A"/>
<g clip-path="url(#ogc)">
 <rect x="0" y="0" width="520" height="190" fill="url(#ogdot)" opacity=".35"/>
 <circle cx="378" cy="128" r="40" fill="#B88A4A"/>
 <path d="M-10 290 L120 175 L175 222 L262 118 L340 196 L382 165 L530 290 Z" fill="#4A68C2"/>
 <path d="M262 118 L236 152 L252 145 L264 160 L278 146 L292 156 Z" fill="#F4F6FB"/>
 <path d="M-10 290 L150 214 L215 250 L300 206 L420 262 L530 290 Z" fill="#0E1B4D" opacity=".55"/>
 <rect x="0" y="290" width="520" height="2" fill="#9FB3E3"/>
 <path d="M-10 292 L120 407 L175 360 L262 464 L340 386 L382 417 L530 292 Z" fill="#9FB3E3" clip-path="url(#ogw2)" opacity=".8"/>
 <g fill="none" stroke="#D5DEF3" stroke-width="2.2" stroke-linecap="round">
  <path d="M88 92 q7 -7 14 0 q7 -7 14 0"/><path d="M128 70 q5 -5 10 0 q5 -5 10 0"/><path d="M60 120 q4 -4 8 0 q4 -4 8 0"/>
 </g>
</g>
<circle cx="260" cy="260" r="250" fill="none" stroke="#0E1B4D" stroke-width="2"/>
</svg>'''


CTA = {'de': 'Kostenfreies Kennenlerngespräch', 'en': 'Free intro call', 'bs': 'Besplatan razgovor', 'ar': 'مكالمة تعارف مجانية'}

CSS = """
#og{position:fixed;inset:0;width:1200px;height:630px;z-index:99999;background:#F4F6FB;overflow:hidden;color:#0E1B4D}
#og *{animation:none!important;transition:none!important}
#og .mk{position:absolute;background:#1D3A9A;opacity:.35}
#og .brand{position:absolute;left:72px;top:58px;display:flex;align-items:center;gap:14px;font-family:'Bricolage Grotesque',sans-serif;font-size:34px;letter-spacing:-.03em;color:#1D3A9A;direction:ltr}
#og .brand b{font-weight:800}#og .brand i{font-style:normal;color:#B88A4A;font-weight:800}
#og .pill{position:absolute;inset-inline-start:72px;top:168px;display:flex;border:1.5px solid #1D3A9A;border-radius:999px;font-size:19px;font-weight:600;color:#1D3A9A;overflow:hidden}
#og .pill span{padding:7px 16px}#og .pill span+span{background:#1D3A9A;color:#F4F6FB}
#og h1{position:absolute;inset-inline-start:72px;top:222px;width:580px;margin:0;font-size:76px;line-height:.98;letter-spacing:-.045em;font-weight:800;color:#0E1B4D}
html[lang=ar] #og h1{letter-spacing:0;line-height:1.35;font-weight:600}
#og h1 .serif{color:#1D3A9A;letter-spacing:-.01em}
#og .foot{position:absolute;inset-inline-start:72px;bottom:56px;display:flex;align-items:center;gap:18px;font-size:22px;font-weight:600}
#og .foot .dom{font-family:'Bricolage Grotesque',sans-serif}
#og .cta{background:#B88A4A;color:#0E1B4D;border-radius:999px;padding:10px 22px;font-weight:700}
#og .art{position:absolute;inset-inline-end:56px;top:50%;transform:translateY(-50%)}
html[dir=rtl] #og .brand{left:auto;right:72px}
html[dir=rtl] #og .art svg{transform:scaleX(-1)}
"""

def marks():
    m = []
    for x, y in [(40, 40), (1160, 40), (40, 590), (1160, 590)]:
        m.append(f'<div class="mk" style="left:{x-18}px;top:{y}px;width:36px;height:1.5px"></div>')
        m.append(f'<div class="mk" style="left:{x}px;top:{y-18}px;width:1.5px;height:36px"></div>')
    return ''.join(m)

def shell(lang):
    return (f'<div id="og">{marks()}<div class="brand">{LOGO}<span><b>polyglot</b><i>.</i>doma</span></div>'
            f'<div class="pill"></div><h1></h1>'
            f'<div class="foot"><span class="cta">{CTA[lang]}</span><span class="dom">polyglotdoma.com</span></div>'
            f'<div class="art">{START_ART}</div></div>')

JS = """(h) => {
  const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d.firstChild);
  const og = document.getElementById('og');
  const eb = document.querySelector('.pd-eyebrow');
  const pill = og.querySelector('.pill');
  if (eb) eb.querySelectorAll(':scope > span').forEach(s => { const x = document.createElement('span'); x.textContent = s.textContent; pill.appendChild(x); });
  else pill.remove();
  const src = document.querySelector('#top h1') || document.querySelector('h1');
  const h1 = og.querySelector('h1');
  h1.innerHTML = src.innerHTML;
  h1.querySelectorAll('*').forEach(e => { const ser = e.classList.contains('serif'); e.removeAttribute('class'); e.removeAttribute('style'); e.removeAttribute('data-r'); if (ser) e.className = 'serif'; });
  const hero = document.querySelector('#top svg[viewBox="0 0 420 440"]');
  if (hero) { const s = hero.cloneNode(true); s.removeAttribute('style'); s.setAttribute('width','510'); s.setAttribute('height','534');
    const a = og.querySelector('.art'); a.innerHTML=''; a.appendChild(s); }
  let fs = 76; h1.style.fontSize = fs + 'px';
  while ((h1.scrollHeight > 280 || h1.scrollWidth > 585) && fs > 44) { fs -= 2; h1.style.fontSize = fs + 'px'; }
  return fs;
}"""

import sys, re
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages = re.findall(r'<loc>https://polyglotdoma.com/(.*?)</loc>', open(ROOT + '/sitemap.xml').read())

def name(p):
    return p.strip('/').replace('/', '-') or 'start'

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for path in pages:
        lang = path.split('/')[0] if path.split('/')[0] in ('en', 'bs', 'ar') else 'de'
        pg.goto('http://localhost:8765/' + path)
        pg.wait_for_load_state('networkidle')
        pg.add_style_tag(content=CSS)
        fs = pg.evaluate(JS, shell(lang))
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(300)
        out = f'{ROOT}/assets/img/og/{name(path)}.png'
        pg.screenshot(path=out, clip={'x': 0, 'y': 0, 'width': 1200, 'height': 630})
        print(name(path), fs)
    b.close()
