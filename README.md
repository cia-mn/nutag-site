# nutag.fun — public pages

Landing page, how-to-play guide, vendor sign-up, privacy policy and terms, MN + EN. Plain HTML, no build step.

- `/` `/en/` — landing: the loop, the eight parts, the pitch to businesses, Google Play link
- `/guide/` `/guide/en/` — how to play (parts, collecting, Gers)
- `/vendor/` `/vendor/en/` — become an Ortoo: two-step form, POSTs to `api.nutag.fun/vendor-applications` (the backend must allow the `https://nutag.fun` origin in `CORS_ALLOWED_ORIGINS`); leads are read in psql, we call them back
- `/privacy/` `/privacy/en/` — privacy policy (App Store / Play Console link)
- `/terms/` `/terms/en/`

Preview: `python3 -m http.server -d . 8000`
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
