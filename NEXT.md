# Next — after the landing redesign (2026-10-20)

The landing (`index.html`, `en/index.html`) now runs on `ds.css`, a small cofounder.co-style design system
(reference page `/ds/`, hero art painted by `art/hero.py`). The rest of the site is still on the old
LatentFolio `style.css`. This is what is left, in order. Delete a line when it is done.

## 1. The other pages follow the landing

Moving a page means: link `ds.css` instead of `style.css`, copy the landing's header and footer markup (keep
every `site.js` hook), rebuild the body from ds.css components, and rewrite its copy against
`general/DOMAIN.md` v5. Use the landing's voice: invite, never command or threaten; MN Өртөө, эд анги
(never хэсэг), Гэр, «Гэр барих»; EN Ortoo, part, Ger, "Raise a Ger", "Today here", "Around here".

- [ ] **`vendor/`, MN + EN.** The copy is wrong (DOMAIN §13). «Захиалга бүр эд анги болно»: it is one part per
      Өртөө per day. It gives a fixed weekly fall, but the venue sets its own window (at least 7 days, longer, or
      never), and this is the page that should say so. It should also say Nutag takes no cut of sales. The footer
      still says «Хэсэг цуглуул. Гэрээ бос.». Keep `form.js` and its POST to `/vendor-applications` working.
- [ ] **`guide/`, MN + EN.** In six places per language it says building needs an order at that Өртөө that day.
      False since 2026-09-12: building needs only the parts. "Rebuild = one uni and one order" is wrong too. Also
      fix the fixed "7 days" and «гэр барих дарааллаар» (the cycle is not the assembly order, GER §7). The guide
      never says a new player starts with all eight parts.
- [ ] **`privacy/`, `terms/`, MN + EN.** Restyle them, and bring the content up to DOMAIN §13: location uses,
      recipients (Google, ubtraffic.mn, SkyData), drops paid to Nutag's own Bonum account, Nutag Pro and App
      Store lines, per-product yield in terms §4, and the `[bracketed]` placeholders and `.todo` boxes.
- [ ] **`map/`, `o/`.** Restyle only. `o/` also has `order.css`, and Cloudflare caches `/o/` for 4 h.
- [ ] **Then remove `style.css`**, its LatentFolio entry in `THIRD_PARTY_NOTICES.md` and the credit links, and the
      "change all ten" note in `README.md`. Drop `style.css` from the Dockerfile.

## 2. Same wording fixes, outside the site

- [ ] App, `nutag/lib/l10n/app_{mn,en}.arb`: `onboardBuildBody` «7 хоног тутам» / "every 7 days" and
      `gerBuiltBody` «Долоо хоног тутам» still give a fixed week. `buildGer` "Raise a ger" should be "Raise a Ger".
      Nothing in the app says a fall keeps 7 of 8 parts. Full list: DOMAIN §13 "App".
- [ ] Console: DOMAIN §13 "Console" (the loop is never explained to a venue; «Онцлох» means two things).

## 3. Decisions that change the landing copy

- [ ] **DOMAIN §12.1, build without a visit.** The hero («Эхний найман эд анги тань биднээс бэлэг тул анхны Гэрээ шууд
      барьж болно») and FAQ 1 promise a first Ger right away. If building comes to need an approved order at that
      Өртөө, rewrite both.
- [ ] **GER §7, cycle order.** If the cycle is reordered to the real assembly order, the parts copy may then claim
      it. Today it rightly doesn't.
- [ ] **«Ногоон цай» / "Nogoon Tsai"**, the example café on the Today card, is made up. Check that no real UB place
      uses the name.

## 4. Polish left on the landing

- [ ] 821–860 px wide: the hero switches back to the 50% crop and the big cloud is cut at the right edge
      (`ds.css`, the `.hero-art` rules near line 166).
- [ ] After a short scroll, the hero shows faintly through the 90% header tint (`.is-over-hero`, `ds.css` ~131).

## Checking

- Serve over http, not `file://` (the grass mask is blocked there): `python3 -m http.server -d . 8000`.
- Full-page shot: `P=$(mktemp -d); google-chrome-stable --headless=new --user-data-dir=$P --virtual-time-budget=4000
  --window-size=1440,7000 --screenshot=out.png http://localhost:8000/`. Add `--force-dark-mode` for dark.
- Headless Chrome won't lay out under 500 px, so for 360/390 load the page inside a fixed-width `<iframe>` on a
  scratch page (or use the desktop app's browser pane at its Mobile size).
- Repaint the hero: `python3 art/hero.py` (deterministic; it asserts the text-safe sky box and the door pixel).
