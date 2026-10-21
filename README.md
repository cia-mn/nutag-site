# nutag.fun — public pages

Landing page, how-to-play guide, vendor sign-up, privacy policy and terms, MN + EN. Plain HTML, no build step.

- `/` `/en/` — landing: what Nutag is, how it works (the Today card), the eight parts, FAQ, the pitch to
  businesses, App Store + Google Play links. Built on `ds.css`
- `/ds/` — the design-system reference: the tokens and components of `ds.css` on one page (the header's glass
  state over the hero shows only on the landing). Not in the nav, not indexed
- `/guide/` `/guide/en/` — how to play: a long-form reading column with a contents list (parts, collecting, drops,
  raising and keeping a Ger, stories, the rules table, FAQ). Built on `ds.css`
- `/vendor/` `/vendor/en/` — become an Ortoo: the pitch, then a two-step form (`vendor/form.js`). Built on `ds.css`. POSTs to `api.nutag.fun/vendor-applications` (the backend must allow the `https://nutag.fun` origin in `CORS_ALLOWED_ORIGINS`); leads are read in psql, we call them back
- `/privacy/` `/privacy/en/` — privacy policy (App Store / Play Console link)
- `/map/` `/map/en/` — the city, every district and every building: a Leaflet viewer over tiles cut by
  `general/carto_poster.py --tiles` and hosted on the backend's R2 bucket (`https://cdn.cia.mn/ub/`);
  `map/districts.json` is the script's output too. Not in the nav yet.
- `/terms/` `/terms/en/`
- `/o/{ortoo id}?t={table}` — the link on an Ortoo's tables, as a QR or an NFC card. A phone with the app
  never loads it: `.well-known/assetlinks.json` and `.well-known/apple-app-site-association` hand `/o/*` to
  the app. A phone without it gets `o/index.html`, whatever the id (`nginx.conf`): the menu, a basket,
  sign-in by the same CIA phone code the app uses, and an order that lands on the shop's till with its
  table. One page for both languages, picked from the browser's; not in the nav, and not indexed.
  Needs `https://nutag.fun` in `CORS_ALLOWED_ORIGINS` on the backend **and on CIA**
  (nutag-general/TABLE_ORDER_PLAN.md).

Preview: `python3 -m http.server -d . 8000` (every page but `/o/`, which needs nginx's rewrite: `docker build -t
nutag-site . && docker run --rm -p 8000:80 nutag-site`, and on localhost it talks to a backend on `:8080` and
the console's fake CIA on `:9999`)
Deploy: image `ghcr.io/cia-mn/nutag-site:main`, service `nutag_site` in `backend/deploy/docker-compose.yml`.

## Look

The landing, the guide, the vendor page, privacy, terms and the map are built on `ds.css`, a small self-contained design system: tokens
(light + dark, documented at the top of the file), header, buttons, hero, kicker, two-tone headings, statement,
steps, card and canvas, the Today card, part tiles, FAQ, the blue band, the grass divider, footer and its pixel
card; for the inner pages also a page head, the till card, the reading column (`.prose`) with its contents list,
lists, note, toast and rules table, and the form fields and stepper. Quiet on purpose:
Inter at 400–500, 1px lines, one blue accent, gold only as a fill. `/ds/` shows each piece with the landing's own
markup; when a component changes, change it there too.

The hero is pixel art painted by `art/hero.py` (PIL, deterministic): `python3 art/hero.py` rewrites
`img/hero.png` (480×240, upscaled in CSS with `image-rendering: pixelated`) and `img/grass.svg` (the ragged
strip's mask). `art/` is not copied into the image.

Only `o/` still uses `style.css` until it migrates (the order and what each page's copy gets wrong:
`NEXT.md`): the design language of
[LatentFolio Free](https://github.com/Dharani-Eswaramurthi/latentfolio) (MIT) carried over by hand: its layers,
header, hero, marquee, cards, call-to-action block and footer, recoloured to the app's blue and gold
(`nutagBlue` / `nutagGold` in `nutag/lib/api.dart`). Two deliberate departures:

- **Fonts are Inter + Lora, self-hosted in `fonts/`.** The theme's Instrument Sans and Newsreader have no
  Cyrillic, and Mongolian Ө and Ү sit in the `cyrillic-ext` range, so each family ships `latin`, `cyrillic`
  and `cyrillic-ext` subsets. Nothing is loaded from a third party.
- **No Astro.** The header and footer are repeated in each page by hand, which is the price of having no
  build step. When you change one, change every page on the same stylesheet:
  `grep -l 'ds.css" />' $(grep -l site-header -r --include=index.html .)` (the landing, `/ds/`, guide, vendor,
  privacy, terms, map; the paths differ by depth; the map has no footer). `o/` is still on `style.css` and has a
  header of its own

`site.js` sends every download link written as the Play page to the App Store on an Apple device (links marked
`data-store` name their store and keep it; `o/order.js` does the same for its button). It is also the theme
toggle (remembered in `localStorage` as `nutag-theme`, system preference otherwise), the mobile menu, the scroll
reveals and the landing's header, glass while over the hero.
Licences: `THIRD_PARTY_NOTICES.md`.

Before submitting to the stores, replace every `[bracketed]` placeholder — legal entity, address,
retention periods, minimum age — and delete the "Still to decide" notes that flag them:

    grep -rn '\[' privacy terms | grep -v href
