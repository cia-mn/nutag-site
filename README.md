# nutag.fun — public pages

Landing page, how-to-play guide, vendor sign-up, privacy policy and terms, MN + EN. Plain HTML, no build step.

- `/` `/en/` — landing: the loop, the eight parts, the pitch to businesses, Google Play link
- `/guide/` `/guide/en/` — how to play (parts, collecting, Gers)
- `/vendor/` `/vendor/en/` — become an Ortoo: two-step form, POSTs to `api.nutag.fun/vendor-applications` (the backend must allow the `https://nutag.fun` origin in `CORS_ALLOWED_ORIGINS`); leads are read in psql, we call them back
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

`style.css` is the design language of [LatentFolio Free](https://github.com/Dharani-Eswaramurthi/latentfolio)
(MIT) carried over by hand: its layers, header, hero, marquee, cards, call-to-action block and footer,
recoloured to the app's blue and gold (`nutagBlue` / `nutagGold` in `nutag/lib/api.dart`). Two deliberate
departures:

- **Fonts are Inter + Lora, self-hosted in `fonts/`.** The theme's Instrument Sans and Newsreader have no
  Cyrillic, and Mongolian Ө and Ү sit in the `cyrillic-ext` range, so each family ships `latin`, `cyrillic`
  and `cyrillic-ext` subsets. Nothing is loaded from a third party.
- **No Astro.** The header and footer are repeated in each page by hand, which is the price of having no
  build step. When you change one, change all ten: `grep -l site-header -r .`

`site.js` is the theme toggle (remembered in `localStorage` as `nutag-theme`, system preference otherwise),
the mobile menu and the scroll reveals. Licences: `THIRD_PARTY_NOTICES.md`.

Before submitting to the stores, replace every `[bracketed]` placeholder — legal entity, address,
retention periods, minimum age — and delete the `.todo` boxes that flag them:

    grep -rn '\[' privacy terms | grep -v href
