#!/usr/bin/env python3
# Hinweis: braucht pip-Pakete uharfbuzz, fonttools, brotli. Ergebnis von Hand in arabisch/index.html (.pl-joinsvg) einsetzen.
"""Erzeugt die SVG-Grafik für die Verbinden-Animation (بَلَد) aus Markazi Text, wght 500.
Je Buchstabe zwei Formen (einzeln / verbunden), Fatha als eigener Pfad."""
import io
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SRC = '/home/claude/polyglotdoma/assets/fonts/markazi-text-arabic-wght-normal.woff2'
tt = TTFont(SRC)
tt = instantiateVariableFont(tt, {'wght': 500})
tt.flavor = None
buf = io.BytesIO(); tt.save(buf); raw = buf.getvalue()
tt = TTFont(io.BytesIO(raw))
gs = tt.getGlyphSet(); order = tt.getGlyphOrder(); upem = tt['head'].unitsPerEm
gdef = tt['GDEF'].table.GlyphClassDef.classDefs
font = hb.Font(hb.Face(raw))

def shape(text):
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {})
    out = []; x = 0
    for inf, pos in zip(b.glyph_infos, b.glyph_positions):
        g = order[inf.codepoint]
        out.append((inf.cluster, g, x + pos.x_offset, pos.y_offset, gdef.get(g) == 3))
        x += pos.x_advance
    return out

def draw(items, dx=0):
    """items: list of (g, x, y) -> (letter_path, mark_path, bounds)"""
    lp, mp = SVGPathPen(gs), SVGPathPen(gs)
    bp = BoundsPen(gs)
    for g, x, y, mark in items:
        t = (1, 0, 0, -1, x + dx, -y)
        gs[g].draw(TransformPen(mp if mark else lp, t))
        if not mark: gs[g].draw(TransformPen(bp, t))
    return lp.getCommands(), mp.getCommands(), bp.bounds

# Verbundenes Wort; Cluster 0 = ب(+Fatha), 2 = ل(+Fatha), 4 = د
word = shape('بَلَد')
letters = {}
for c in (0, 2, 4):
    letters[c] = draw([(g, x, y, m) for cl, g, x, y, m in word if cl == c])

# Einzelformen, horizontal auf die Mitte der verbundenen Form gesetzt
iso = {}
for c, t in ((0, 'بَ'), (2, 'لَ'), (4, 'د')):
    gl = shape(t)
    lp, mp, (x0, y0, x1, y1) = draw([(g, x, y, m) for cl, g, x, y, m in gl])
    cx0, _, cx1, _ = letters[c][2]
    dx = (cx0 + cx1) / 2 - (x0 + x1) / 2
    iso[c] = draw([(g, x, y, m) for cl, g, x, y, m in gl], dx)

# Abstände: in beiden getrennten Phasen gleich große Lücken G zwischen den sichtbaren Formen, mittig zum Wort
G = int(0.30 * upem)
wl, _, wr, _ = (min(letters[c][2][0] for c in letters), 0, max(letters[c][2][2] for c in letters), 0)
mid = (wl + wr) / 2
def offsets(forms):
    seq = [4, 2, 0]                      # sichtbar von links: د, ل, ب
    widths = [forms[c][2][2] - forms[c][2][0] for c in seq]
    left = mid - (sum(widths) + G * (len(seq) - 1)) / 2
    off = {}
    for c, w in zip(seq, widths):
        off[c] = int(left - forms[c][2][0]); left += w + G
    return off
s0, s1 = offsets(iso), offsets(letters)
xs, ys = [], []
for c in (0, 2, 4):
    for b in (letters[c][2], iso[c][2]):
        for o in (s0[c], s1[c], 0):
            xs += [b[0] + o, b[2] + o]
        ys += [b[1], b[3]]
asc = 1.05 * upem; desc = 0.45 * upem   # großzügig für Fatha / Unterlängen
x0, x1 = min(xs) - 40, max(xs) + 40
vb = (int(x0), int(-asc), int(x1 - x0), int(asc + desc))
parts = []
for c, cls in ((0, 'c1'), (2, 'c2'), (4, 'c3')):
    il, im, _ = iso[c]; cl, cm, _ = letters[c]
    parts.append(
        '<g class="pl-g %s" data-s0="%d" data-s1="%d" style="transform: translateX(%dpx)">'
        '<g class="pl-iso"><path d="%s"/>%s</g>'
        '<g class="pl-con"><path d="%s"/>%s</g></g>' % (
            cls, s0[c], s1[c], s0[c],
            il, ('<path class="pl-mk" d="%s"/>' % im) if im else '',
            cl, ('<path class="pl-mk" d="%s"/>' % cm) if cm else ''))
svg = ('<svg class="pl-joinsvg" viewBox="%d %d %d %d" style="width: %.3fem; height: %.3fem" aria-hidden="true">%s</svg>'
       % (vb[0], vb[1], vb[2], vb[3], vb[2] / upem, vb[3] / upem, ''.join(parts)))
open('/home/claude/scratch/join.svg.txt', 'w').write(svg)
print(len(svg), vb, upem)
