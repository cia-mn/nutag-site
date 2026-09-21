# nutag.fun — public pages

How-to-play guide, privacy policy and terms, MN + EN. Plain HTML, no build step.

- `/guide/` `/guide/en/` — how to play (parts, collecting, Gers)
- `/privacy/` `/privacy/en/` — privacy policy (App Store / Play Console link)
- `/terms/` `/terms/en/`
- `/vendor/` `/vendor/en/` — become an Ortoo: two-step form, POSTs to `api.nutag.fun/vendor-applications` (the backend must allow the `https://nutag.fun` origin in `CORS_ALLOWED_ORIGINS`); leads are read in psql, we call them back

Preview: `python3 -m http.server -d . 8000`
Deploy: image `ghcr.io/cia-mn/nutag-site:main`, service `nutag_site` in `backend/deploy/docker-compose.yml`.

Before submitting to the stores, replace every `[bracketed]` placeholder — legal entity, address,
retention periods, minimum age — and delete the `.todo` boxes that flag them:

    grep -rn '\[' privacy terms | grep -v href
