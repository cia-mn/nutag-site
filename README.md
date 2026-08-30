# nutag.mn — public pages

Privacy policy and terms, MN + EN. Plain HTML, no build step.

- `/privacy/` `/privacy/en/` — privacy policy (App Store / Play Console link)
- `/terms/` `/terms/en/`

Preview: `python3 -m http.server -d . 8000`
Deploy: image `ghcr.io/cia-mn/nutag-site:main`, service `nutag_site` in `backend/deploy/docker-compose.yml`.

Before submitting to the stores, replace every `[bracketed]` placeholder — legal entity, address,
retention periods, minimum age — and delete the `.todo` boxes that flag them:

    grep -rn '\[' privacy terms | grep -v href
