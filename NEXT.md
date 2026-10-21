# Next — after the landing redesign (2026-10-20)

The landing (`index.html`, `en/index.html`), the guide, the vendor page, privacy, terms and the map now run on `ds.css`, a small
cofounder.co-style design system (reference page `/ds/`, hero art painted by `art/hero.py`). Only `o/` is
still on the old LatentFolio `style.css`. This is what is left, in order. Delete a line when it is done.

## 1. The other pages follow the landing

Moving a page means: link `ds.css` instead of `style.css`, copy the landing's header and footer markup (keep
every `site.js` hook), rebuild the body from ds.css components, and rewrite its copy against
`general/DOMAIN.md` v5. Use the landing's voice: invite, never command or threaten; MN Өртөө, эд анги
(never хэсэг), Гэр, «Гэр барих»; EN Ortoo, part, Ger, "Raise a Ger", "Today here", "Around here".

- [ ] **`o/`.** Restyle only, but it is the live ordering and payment page: `order.js` builds style.css's
      `.button .button-primary/.button-ghost`, `.card` and `.done-mark`; `order.css` reads style.css tokens
      (`--paper-light`, `--ink-soft`, `--line-strong`, `--inverse-*`, `--radius*`, `--font-serif`) and sits in
      `@layer`s, which would lose to ds.css's unlayered rules. Test the whole order against a local backend
      and the console's fake CIA (`order.js` switches to them on localhost). Cloudflare caches `/o/` for 4 h.
- [ ] **Then remove `style.css`**, its LatentFolio entry in `THIRD_PARTY_NOTICES.md` and the credit links, and the
      `style.css` half of the header/footer note in `README.md`. Drop `style.css` from the Dockerfile.

## 2. Privacy and terms: decisions only the owner can make

- [ ] The `[bracketed]` placeholders, flagged on the page by a "Still to decide" / «Шийдэх зүйл» note: how many
      years order and payment records are kept (`[N]`), server log days (`[30]`), where the server and database
      are (`[location]`), and the minimum age (`[13]`) with the store age rating to match. Then delete the notes.

## 3. Same wording fixes, outside the site

- [ ] App, `nutag/lib/l10n/app_{mn,en}.arb`: `onboardBuildBody` «7 хоног тутам» / "every 7 days" and
      `gerBuiltBody` «Долоо хоног тутам» still give a fixed week. `buildGer` "Raise a ger" should be "Raise a Ger".
      Nothing in the app says a fall keeps 7 of 8 parts. Full list: DOMAIN §13 "App".
- [ ] Console: DOMAIN §13 "Console" (the loop is never explained to a venue; «Онцлох» means two things).

## 4. Decisions that change the landing copy

- [ ] **DOMAIN §12.1, build without a visit.** The hero («Эхний найман эд анги тань биднээс бэлэг тул анхны Гэрээ шууд
      барьж болно») and FAQ 1 promise a first Ger right away, and so do the guide (#start, #raise, FAQ 1 and 8, the
      rules table) and the vendor FAQ. If building comes to need an approved order at that Өртөө, rewrite them all.
- [ ] **GER §7, cycle order.** If the cycle is reordered to the real assembly order, the parts copy may then claim
      it. Today it rightly doesn't.
- [ ] **«Ногоон цай» / "Nogoon Tsai"**, the example café on the Today card, is made up. Check that no real UB place
      uses the name.

## Checking

- Serve over http, not `file://` (the grass mask is blocked there): `python3 -m http.server -d . 8000`.
- Full-page shot: `P=$(mktemp -d); google-chrome-stable --headless=new --user-data-dir=$P --virtual-time-budget=4000
  --window-size=1440,7000 --screenshot=out.png http://localhost:8000/`. Add `--force-dark-mode` for dark.
- Headless Chrome won't lay out under 500 px, so for 360/390 load the page inside a fixed-width `<iframe>` on a
  scratch page (or use the desktop app's browser pane at its Mobile size).
- Repaint the hero: `python3 art/hero.py` (deterministic; it asserts the text-safe sky box and the door pixel).
