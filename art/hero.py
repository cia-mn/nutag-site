#!/usr/bin/env python3
"""Paint the landing hero: a pixel-art Mongolian steppe with one Ger.

Writes ../img/hero.png (480x240 palette PNG, upscaled in CSS with
image-rendering: pixelated) and ../img/grass.svg (the ragged strip mask).
Deterministic: same script, same bytes.  Run: python3 site/art/hero.py
"""
import math
import random
from pathlib import Path

from PIL import Image

W, H = 480, 240
SAFE_W, SAFE_H = 232, 130  # text-safe box: sky only (the headline sits here)
OUT = Path(__file__).resolve().parent.parent / 'img'

PAL = {  # name -> colour; order = palette index (32 max)
    'sky0': '#2a5f9e', 'sky1': '#3067aa', 'sky2': '#356fb4', 'sky3': '#3a78bd', 'haze': '#5a92cf',
    'cloud': '#ffffff', 'cloud_sh': '#d6e4f3', 'cloud_dk': '#b4cbe6',
    'ridge': '#6a8db6', 'ridge_sh': '#5c80aa', 'city': '#93abc6', 'city_lt': '#b7c8db',
    'hill': '#6e9e52', 'hill_sh': '#5b8c4a',
    'grass0': '#8bc25a', 'grass1': '#74b04f', 'grass2': '#62a045', 'tuft': '#4c8a38',
    'path': '#d2c08f', 'path_sh': '#b8a676',
    'felt': '#f6f3ec', 'felt_sh': '#dcd5c8', 'felt_dk': '#c4bba9', 'roof': '#ebe6dc',
    'wood': '#9a623a', 'brown': '#7a4a2a', 'mane': '#3b2618',
    'door': '#c4562b', 'door_sh': '#a4451f', 'gold': '#f5b855', 'iron': '#55565a', 'lilac': '#b48fd8',
}
NAMES = list(PAL)
IDX = {n: i for i, n in enumerate(NAMES)}
RGB = {n: tuple(int(PAL[n][k:k + 2], 16) for k in (1, 3, 5)) for n in NAMES}

img = Image.new('P', (W, H))
img.putpalette([v for n in NAMES for v in RGB[n]])
px = img.load()


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = IDX[c]


def get(x, y):
    return NAMES[px[x, y]]


def rect(x0, y0, x1, y1, c):  # inclusive
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(x, y, c)


# ordered-dither ramp: row k of a join shows the lower colour where this is true (25 / 50 / 75 %)
RAMP = [lambda x, y: (x + 2 * (y % 2)) % 4 == 0, lambda x, y: (x + y) % 2 == 0, lambda x, y: (x + 2 * (y % 2)) % 4 != 2]


def bands(y0, y1, cols, edges, wobble=lambda x: 0):
    """Fill rows y0..y1 with colour bands; each edge is a 3-row dither ramp starting at the edge row."""
    for x in range(W):
        for y in range(y0, y1 + 1):
            c = cols[0]
            for j, e in enumerate(edges):
                d = y - (e + wobble(x))
                if d >= 3:
                    c = cols[j + 1]
                elif d >= 0:
                    c = cols[j + 1] if RAMP[d](x, y) else cols[j]
            put(x, y, c)


def sprite(x0, y0, rows, key):
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch in key:
                put(x0 + dx, y0 + dy, key[ch])


def bump(x, cx, top, hw, base=150):
    t = abs(x - cx) / hw
    return base if t >= 1 else top + (base - top) * (1 - math.cos(math.pi * t)) / 2


def cloud(puffs, bottom, x_min=400, x_max=476):
    """Pixel cumulus: union of puffs, flat bottom, each puff shaded on its lower right."""
    for x in range(x_min, x_max + 1):
        for y in range(bottom - 40, bottom + 1):
            inside = [(x - cx) * .45 + (y - cy) - .2 * r for cx, cy, r in puffs
                      if (x - cx) ** 2 + (y - cy) ** 2 < r * (r - .6)]  # no 1px nubs at the poles
            if not inside:
                continue
            c = 'cloud_sh' if min(inside) > 0 else 'cloud'
            if y >= bottom - 1:
                c = 'cloud_dk' if y == bottom else 'cloud_sh'
            put(x, y, c)


def paint():
    rnd = random.Random(7)

    # sky: darkest at the top so white text keeps >= 4.5:1; haze sits below the text, behind the ridges
    bands(0, 150, ['sky0', 'sky1', 'sky2', 'sky3', 'haze'], [34, 70, 102, 140])

    # clouds, right edge only (x 400-476): nothing nearer the centre, where phone and tablet text sits
    cloud([(414, 60, 7), (426, 52, 10), (441, 47, 12), (456, 51, 10), (468, 57, 7), (434, 60, 7), (450, 60, 8)], 66)
    cloud([(437, 28, 4), (445, 24, 6), (455, 27, 5), (463, 30, 3)], 32)
    cloud([(410, 85, 4), (418, 82, 5), (426, 85, 4)], 88)

    # far ridge: the hills north of the city, darker than the haze so stray text keeps some contrast.
    # Low under the text (>= 138 at x < 232, >= 133 in the phone crop); one big mountain on the far right
    hills = [(40, 142, 60), (150, 141, 70), (262, 134, 40), (318, 137, 36), (372, 133, 34),
             (452, 108, 54), (420, 126, 22), (488, 120, 30)]
    smooth = [min(bump(x, *h) for h in hills) for x in range(W)]
    for x in range(W):
        t = round(smooth[x])
        down = smooth[min(W - 1, x + 1)] > smooth[max(0, x - 1)] + .05  # right-facing slope = shade
        rect(x, t, x, 150, 'ridge_sh' if down else 'ridge')

    # city at x 230-262: right of every desktop text column, left of every phone crop (desktop + tablet only)
    for tx, tw, th in [(230, 3, 6), (233, 4, 10), (237, 3, 7), (240, 4, 12), (252, 3, 9), (255, 4, 14),
                       (259, 3, 8), (262, 3, 5)]:
        y0 = 150 - th
        rect(tx, y0, tx + tw - 1, 150, 'city')
        rect(tx, y0, tx, 150, 'city_lt')  # sunlit left face
        for y in range(y0 + 2, 147, 3):
            for x in range(tx + 2, tx + tw, 2):
                put(x, y, 'city_lt')
    for r in range(23):  # Blue Sky Tower: a sail, straight right side, curved left side
        w = round(1 + 6 * math.sqrt(r / 22))
        rect(251 - w, 128 + r, 250, 128 + r, 'city')
        put(251 - w, 128 + r, 'city_lt')

    # near hills: a rolling green band in front of the city
    for x in range(W):
        f = lambda u: 147.5 + 2.5 * math.sin(u / 23) + 1.5 * math.sin(u / 9 + 1)
        t = round(f(x))
        rect(x, t, x, 157, 'hill_sh' if f(x + .5) > f(x - .5) else 'hill')

    # steppe: bright far, darker near; wavy dithered joins
    for x in range(W):
        rect(x, round(153.5 + 1.5 * math.sin(x / 13 + 2)), x, 157, 'grass0')
    bands(157, 239, ['grass0', 'grass1', 'grass2'], [180, 216], wobble=lambda x: round(2 * math.sin(x / 29)))
    for cx, cy, rx, ry, c in [(110, 197, 74, 5, 'grass0'), (236, 207, 52, 4, 'grass0'), (452, 196, 46, 4, 'grass0'),
                              (180, 224, 70, 4, 'grass1'), (420, 226, 60, 3, 'grass1')]:  # sunlit swells
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / rx) ** 2 + ((y - cy) / (ry * (1 + .3 * math.sin(x / 6 + cx)))) ** 2 <= 1:
                    put(x, y, c)

    # far texture: short dashes of the next band, thinning toward the horizon
    for _ in range(90):
        x, y = rnd.randrange(W), rnd.randrange(160, 214)
        rect(x, y, x + 1 + (y > 185), y, 'grass1' if y < 196 else 'grass2')

    # a small flock near the horizon, right of the phone crop (desktop only)
    for sx, sy in [(408, 163), (413, 162), (417, 164), (422, 163), (428, 164)]:
        sprite(sx, sy, ['mcc', '.ss'], {'m': 'mane', 'c': 'cloud', 's': 'cloud_sh'})

    # a worn footpath from the door down to the viewer
    for y in range(213, 240):
        d = y - 213
        cx = 336 - d * 1.2 - 5 * math.sin(d / 9)
        hw = 1 + d * .16
        for x in range(math.floor(cx - hw), math.ceil(cx + hw) + 1):
            put(x, y, 'path_sh' if x >= cx + hw - .5 or y == 213 else 'path')

    # tufts: sparse far, taller near; none on the path, the Ger, the horse or the bottom strip
    for _ in range(170):
        x, y = rnd.randrange(W), rnd.randrange(162, 231)
        if (300 <= x <= 394 and 168 <= y <= 217) or get(x, y).startswith('path'):
            continue
        near = (y - 160) / 70
        if near < .3:
            continue
        put(x, y, 'tuft')
        if near > .45:
            put(x - 1, y - 1, 'tuft')
            put(x + 1, y - 1, 'tuft')
        if near > .8:
            put(x, y - 2, 'tuft')

    # Ger, centred at x 336, door facing the viewer
    rect(314, 213, 366, 213, 'tuft')  # ground shadow, cast right
    rect(318, 214, 364, 214, 'tuft')
    for x in range(312, 361):  # wall: lit left, shaded right third, a darker rim on both sides
        c = 'felt_dk' if x >= 358 or x == 312 else 'felt_sh' if x >= 344 else 'felt'
        rect(x, 192, x, 212, c)
        put(x, 212, 'felt_sh' if c == 'felt' else 'felt_dk')  # skirt row
    for y in range(176, 193):  # roof cone with a 2px eave overhang
        hw = round(5 + (y - 176) * 21 / 16)
        for x in range(336 - hw, 337 + hw):
            c = 'felt_sh' if x > 336 + hw * .4 else 'roof'
            put(x, y, 'felt_dk' if x == 336 + hw or y == 192 else c)
    for k in (-.62, -.25):  # two roof ropes on the lit side
        for y in range(178, 192):
            put(round(336 + k * (5 + (y - 176) * 21 / 16)), y, 'felt_sh')
    rect(312, 193, 360, 193, 'felt_dk')  # eave shadow on the wall
    rect(331, 174, 341, 176, 'wood')  # toono crown
    rect(333, 173, 339, 173, 'wood')
    rect(338, 174, 341, 176, 'brown')
    for y in (197, 202, 207):  # three belts, broken at the door
        rect(312, y, 329, y, 'brown')
        rect(343, y, 360, y, 'brown')
    rect(330, 197, 342, 212, 'gold')  # door frame
    rect(331, 198, 341, 212, 'door')
    rect(341, 198, 341, 212, 'door_sh')
    for x, y in [(336, 200), (335, 201), (337, 201), (336, 202)]:
        put(x, y, 'gold')
    rect(346, 166, 347, 178, 'iron')  # chimney, then smoke drifting right
    rect(345, 166, 348, 166, 'iron')
    sprite(347, 150, [
        '.......ccc.',
        '......ccccc',
        '...cc.cccss',
        '..cccs.sss.',
        '..css......',
        '.c.........',
        'cc.........',
        's..........',
        '...........',
        '.c.........',
        '...........',
        'c..........',
    ], {'c': 'cloud', 's': 'cloud_sh'})

    # horse grazing, head down, facing the Ger
    rect(373, 214, 389, 214, 'tuft')
    sprite(371, 203, [
        '........wwwww....',
        '.....mwwbbbbbbm..',
        '....mbbbbbbbbbbm.',
        '...mbbbbbbbbbbbm.',
        '..mbbbbbbbbbbbbmm',
        '.mbbb.bbbbbbbbb.m',
        '.bbb..bb.....bb.m',
        'mbb...bb.....bb..',
        'bbb...b.b...b.b..',
        'bb....b.b...b..b.',
        'bb....b.b...b..b.',
        'mm....m.m...m..m.',
    ], {'b': 'brown', 'w': 'wood', 'm': 'mane'})

    # flowers: single pixels, denser to the left, plus a few daisies up front
    for _ in range(40):
        x, y = int(W * rnd.random() ** 1.6), rnd.randrange(214, 232)
        if get(x, y).startswith('grass'):
            put(x, y, rnd.choice(('gold', 'gold', 'cloud', 'lilac')))
    for x, y, c in [(52, 226, 'gold'), (61, 222, 'cloud'), (96, 228, 'gold'), (148, 224, 'lilac'),
                    (206, 229, 'cloud'), (418, 227, 'gold')]:
        for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            put(x + dx, y + dy, c)
        put(x, y, 'gold' if c != 'gold' else 'path_sh')
        put(x, y + 2, 'tuft')
    for x, y in [(30, 225), (118, 229), (176, 221), (232, 227), (446, 222)]:  # yargui, the lilac steppe pasque flower
        sprite(x - 2, y - 3, ['l.l.l', 'lllll', '.lgl.', '..t..', '.tt..', '..t..'],
               {'l': 'lilac', 'g': 'gold', 't': 'tuft'})


def grass_svg(seed=7, w=160):
    """Ragged top of the paper strip: seeded walk of column tops 2..7, a few 1px tufts, wraps seamlessly."""
    rnd = random.Random(seed)
    tops, t = [], 5
    for x in range(w):
        t = max(2, min(7, t + rnd.choice((-1, 0, 0, 1))))
        if x > w - 8:  # steer back to the first column so repeat-x has no seam
            t += (tops[0] > t) - (tops[0] < t)
        tops.append(t)
    for x in rnd.sample(range(w), 12):
        tops[x] = max(1, tops[x] - 1)
    d = ''.join(f'M{x} {t}h1V8h-1z' for x, t in enumerate(tops))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 8" width="160" height="8" '
            f'preserveAspectRatio="none" shape-rendering="crispEdges"><path d="{d}"/></svg>\n')


if __name__ == '__main__':
    paint()
    OUT.mkdir(exist_ok=True)
    img.save(OUT / 'hero.png', optimize=True)
    (OUT / 'grass.svg').write_text(grass_svg())

    check = Image.open(OUT / 'hero.png').convert('RGB')  # optimize may reindex the palette: compare colours
    cp = check.load()
    sky = {RGB['sky0'], RGB['sky1'], RGB['sky2'], RGB['sky3']}
    assert check.size == (W, H)
    assert all(cp[x, y] in sky for x in range(SAFE_W) for y in range(SAFE_H)), 'text-safe box must be sky only'
    assert cp[336, 205] == RGB['door'], 'door pixel'
    print('ok', (OUT / 'hero.png').stat().st_size, 'bytes,', len(check.getcolors()), 'colours')
