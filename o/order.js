// The page a table's QR or NFC card opens on a phone without the app: this Ortoo's menu, a basket,
// and an order that reaches the same till the app's orders do. The address is the whole input —
// /o/{ortoo id}?t={table}&k={key} — and a phone with the app never sees this page (.well-known/).
// The key is traded for an hour's table session at once, and the address keeps only that (?s=), so
// a link saved or shared from here stops being at the table an hour after its last order.
//
// Everything a shop typed reaches the page through textContent, never innerHTML: a menu is text
// strangers wrote, shown to strangers.

// On a developer's machine: a local backend, and the fake CIA the console's e2e runs
// (console/e2e/fakecia.mjs) — a page under test must never text a real phone.
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API = local ? 'http://localhost:8080' : 'https://api.nutag.fun';
const CIA = local ? 'http://localhost:9999/api/v1' : 'https://api.cia.mn/api/v1';
const PLAY = 'https://play.google.com/store/apps/details?id=com.nutag.fun';

const id = location.pathname.split('/').filter(Boolean)[1] ?? '';
const params = new URLSearchParams(location.search);
let session = params.get('s') ?? ''; // a live table session: its table, and the QR-only items
let table = '';
let ended = false; // a saved link whose hour is up

const en = (navigator.language ?? '').toLowerCase().startsWith('en');
document.documentElement.lang = en ? 'en' : 'mn';
const T = en ? {
  ended: 'This link is no longer at a table. Scan the code on your table to order from it.',
  openApp: 'Open in the app', getApp: 'Get the app', specials: 'Specials', table: 'Table', today: 'Here today: ', closed: 'Closed now',
  empty: 'Nothing on the menu yet', other: 'Other', item: 'item', items: 'items', order: 'Order', pay: 'Pay', counter: 'Pay at the counter',
  phoneTitle: 'Confirm your phone number', phoneBody: 'We text a code. The same number signs you in to the Nutag app.',
  phone: 'Phone number', getCode: 'Get the code', code: 'The 6-digit code', verify: 'Confirm', cancel: 'Cancel',
  badPhone: 'That phone number does not look right', badCode: 'The code is wrong or has expired',
  sent: 'Order sent', sentBody: 'Staff have your order. Pay at the counter or when it is brought to you.',
  paid: 'Payment received', part: 'Your part is waiting for you in the Nutag app: ', partSoon: 'One part a day, yours in the Nutag app once staff confirm the order. Today’s here: ',
  again: 'Order more', bank: 'Choose your bank', page: 'Pay on the payment page', qr: 'Pay by QR from another device',
  waiting: 'Waiting for the payment…', payFailed: 'The payment did not go through', tooMany: 'You have too many orders waiting. Please ask the staff.',
  missing: 'This Ortoo was not found', failed: 'Something went wrong. Please try again.', retry: 'Try again',
  parts: { toono: 'Toono', bagana: 'Bagana', khaalga: 'Khaalga', orkh: 'Orkh', esgii: 'Esgii', busluur: 'Busluur', khana: 'Khana', uni: 'Uni' },
} : {
  ended: 'Энэ холбоос ширээнд холбогдохоо больсон. Ширээнээс захиалахын тулд ширээн дээрх кодыг уншуулна уу.',
  openApp: 'Апп-аар нээх', getApp: 'Апп татах', specials: 'Онцлох', table: 'Ширээ', today: 'Өнөөдөр энд: ', closed: 'Хаалттай',
  empty: 'Цэс хоосон байна', other: 'Бусад', item: 'зүйл', items: 'зүйл', order: 'Захиалах', pay: 'Төлөх', counter: 'Касс дээр төлөх',
  phoneTitle: 'Утасны дугаараа баталгаажуулна уу', phoneBody: 'Бид код илгээнэ. Nutag апп-д мөн энэ дугаараар нэвтэрнэ.',
  phone: 'Утасны дугаар', getCode: 'Код авах', code: '6 оронтой код', verify: 'Баталгаажуулах', cancel: 'Болих',
  badPhone: 'Утасны дугаар буруу байна', badCode: 'Код буруу эсвэл хугацаа нь дууссан байна',
  sent: 'Захиалга илгээгдлээ', sentBody: 'Ажилтан таны захиалгыг хүлээн авлаа. Төлбөрөө касс дээр эсвэл ажилтанд төлнө үү.',
  paid: 'Төлбөр амжилттай', part: 'Таны эд анги Nutag апп-д хүлээж байна: ', partSoon: 'Өдөрт нэг эд анги — ажилтан захиалгыг батлангуут Nutag апп-д таных болно. Өнөөдөр энд: ',
  again: 'Дахин захиалах', bank: 'Банкаа сонгоно уу', page: 'Төлбөрийн хуудсаар төлнө үү', qr: 'Өөр төхөөрөмжөөс QR-аар төлөх',
  waiting: 'Төлбөр хүлээж байна…', payFailed: 'Төлбөр баталгаажсангүй', tooMany: 'Таны хүлээгдэж буй захиалга олон байна. Ажилтанд хандана уу.',
  missing: 'Ийм Өртөө олдсонгүй', failed: 'Алдаа гарлаа. Дахин оролдоно уу.', retry: 'Дахин оролдох',
  parts: { toono: 'Тооно', bagana: 'Багана', khaalga: 'Хаалга', orkh: 'Өрх', esgii: 'Эсгий', busluur: 'Бүслүүр', khana: 'Хана', uni: 'Унь' },
};

const main = document.querySelector('main');
const sheet = document.getElementById('sheet');

/** Children as they are written down: nested lists flattened, and `cond && node` dropped when it is not. */
const kept = (kids) => kids.flat().filter((k) => k != null && k !== false && k !== '');

/** h('p', { className: 'x' }, 'text', child) — an element, its properties, its children. */
function h(tag, props, ...kids) {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kept(kids));
  return el;
}

// On Android the link is an intent: the app if it is installed, its Play page if not. It is also
// what gets someone out of an in-app browser (a bank's scanner, Facebook), where a tapped link
// never leaves for the app on its own.
const app = document.getElementById('app');
const android = /Android/i.test(navigator.userAgent);
app.textContent = android ? T.openApp : T.getApp;
// Again whenever the address changes, so the app is handed the session rather than a spent key.
const linkApp = () => {
  if (android) app.href = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.nutag.fun;S.browser_fallback_url=${encodeURIComponent(PLAY)};end`;
};
linkApp();

// ---- the session: the same CIA tokens the app holds, for the same account ----

let memory = null; // private browsing can refuse localStorage; the order still has to go through
const tokens = {
  get() {
    try { return JSON.parse(localStorage.getItem('nutag.tokens')) ?? memory; } catch { return memory; }
  },
  set(t) {
    memory = t;
    try { t ? localStorage.setItem('nutag.tokens', JSON.stringify(t)) : localStorage.removeItem('nutag.tokens'); } catch { /* memory holds it */ }
  },
};
const parse = (t) => (t && typeof t.access_token === 'string' ? { access: t.access_token, refresh: t.refresh_token ?? null } : null);
const cia = (path, body) => fetch(CIA + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-App': 'nutag' }, body: JSON.stringify(body),
});

async function refresh() {
  const old = tokens.get();
  if (!old?.refresh) return false;
  const r = await cia('/auth/refresh', { refresh_token: old.refresh });
  const d = r.ok ? await r.json() : null;
  const fresh = parse(d?.tokens ?? d?.token);
  if (fresh) tokens.set({ access: fresh.access, refresh: fresh.refresh ?? old.refresh }); // CIA may not rotate it
  return !!fresh;
}

async function api(method, path, body, signed = false) {
  const send = () => fetch(API + path, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(signed && { Authorization: 'Bearer ' + tokens.get()?.access }) },
    body: body && JSON.stringify(body),
  });
  let r = await send();
  if (r.status === 401 && signed && (await refresh())) r = await send();
  if (r.status === 401 && signed) tokens.set(null);
  if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
  return r.json();
}

/** Opens the sheet on `content`; settles with what close() was handed, or undefined if dismissed. */
function ask(content) {
  sheet.replaceChildren(...kept(content));
  sheet.returnValue = '';
  sheet.showModal();
  return new Promise((done) => sheet.addEventListener('close', () => done(sheet.returnValue || undefined), { once: true }));
}

/** Phone, then the code CIA texts it. Resolves true once there are tokens. */
async function signIn() {
  const error = h('p', { className: 'order-error', hidden: true });
  const fail = (text) => { error.textContent = text; error.hidden = false; };
  const phone = h('input', { type: 'tel', name: 'phone', autocomplete: 'tel', inputMode: 'tel', placeholder: '9911 2233' });
  const code = h('input', { name: 'code', autocomplete: 'one-time-code', inputMode: 'numeric', maxLength: 6 });
  const codeRow = h('label', { hidden: true }, T.code, code);
  const go = h('button', { className: 'button button-primary', type: 'submit' }, T.getCode);
  let identifier = null;

  // No `required` on either field: the code's is hidden for the first step, and a browser will not
  // submit a form whose invalid field it cannot show. Both are checked below instead.
  const form = h('form', { method: 'dialog' },
    h('h2', {}, T.phoneTitle), h('p', {}, T.phoneBody),
    h('label', {}, T.phone, phone), codeRow, error,
    h('div', { className: 'order-actions' }, h('button', { className: 'button button-ghost', type: 'button', onclick: () => sheet.close() }, T.cancel), go));
  form.onsubmit = async (e) => {
    e.preventDefault();
    error.hidden = true;
    go.disabled = true;
    try {
      if (identifier === null) {
        // Bare digits are a Mongolian number to CIA; anything else has to arrive with its +.
        const number = phone.value.replace(/[\s()-]/g, '');
        if (!/^\+?\d{6,15}$/.test(number)) return fail(T.badPhone);
        const r = await cia('/auth/login', { phone: number, delivery_method: 'mt' });
        if (r.status === 400) return fail(T.badPhone);
        if (!r.ok) return fail(T.failed);
        const d = await r.json();
        const direct = parse(d.token);
        if (direct) { tokens.set(direct); return sheet.close('ok'); }
        identifier = typeof d.identifier === 'string' && d.identifier ? d.identifier : number;
        phone.readOnly = true;
        codeRow.hidden = false;
        go.textContent = T.verify;
        code.focus();
      } else {
        const r = await cia('/auth/verify', { identifier, code: code.value.trim() });
        if (r.status >= 500) return fail(T.failed);
        const t = r.ok ? parse((await r.json()).token) : null;
        if (!t) return fail(T.badCode);
        tokens.set(t);
        sheet.close('ok');
      }
    } catch {
      fail(T.failed);
    } finally {
      go.disabled = false;
    }
  };
  return (await ask([form])) === 'ok';
}

// ---- the menu and the basket ----

let ortoo;
const basket = new Map(); // "product|variant" → { product_id, item_id, price, qty }
const money = (n) => (ortoo.currency === 'MNT'
  ? Math.round(n).toLocaleString('en-US') + '₮'
  : new Intl.NumberFormat(undefined, { style: 'currency', currency: ortoo.currency }).format(n));
const bar = h('div', { className: 'order-bar', hidden: true });
const note = h('p', { className: 'order-error', hidden: true, role: 'alert' });

/** What one of these costs now: the variant's own price, else the product's — its sale price while it has one. */
const priceOf = (product, item) => item?.price ?? product.sale_price ?? product.price;

/** The price as the menu prints it: a sale shows what it was, struck through. */
function price(product, item) {
  const sale = item?.price == null && product.sale_price != null;
  return h('span', { className: 'order-price' }, item && h('span', {}, item.title),
    h('span', {}, sale && h('s', {}, money(product.price)), h('b', { className: sale ? 'is-sale' : '' }, money(priceOf(product, item)))));
}

function stepper(product, item) {
  const key = product.id + '|' + (item?.id ?? '');
  const price = priceOf(product, item);
  const count = h('output', {}, '0');
  const step = (by) => {
    const qty = Math.min(99, Math.max(0, (basket.get(key)?.qty ?? 0) + by));
    qty ? basket.set(key, { product_id: product.id, ...(item && { item_id: item.id }), price, qty }) : basket.delete(key);
    count.textContent = qty;
    box.classList.toggle('is-empty', !qty);
    drawBar();
  };
  const name = product.title + (item ? ' · ' + item.title : '');
  // Nothing in the basket yet: one round "+" to add. The count and "−" open out once there is.
  const box = h('span', { className: 'order-stepper is-empty' },
    h('button', { type: 'button', ariaLabel: '− ' + name, onclick: () => step(-1) }, '−'), count,
    h('button', { type: 'button', ariaLabel: '+ ' + name, onclick: () => step(1) }, '+'));
  return box;
}

/** A menu line. `wide` is a card in the specials strip, which wants the landscape picture. */
function row(product, wide) {
  const { square, horizontal, vertical } = product.image ?? {};
  const picture = wide ? horizontal || square || vertical : square || horizontal || vertical;
  const variants = product.items ?? [];
  const off = product.sale_price != null && Math.round(100 - (product.sale_price / product.price) * 100);
  const tags = (product.badge || off) && h('p', { className: 'order-tags' },
    product.badge && h('span', { className: 'order-tag' }, product.badge),
    off && h('span', { className: 'order-tag is-sale' }, `−${off}%`));
  return h('li', { className: 'order-item' },
    // Every line has a picture, a blank with the name's first letter if need be, so the names line up.
    h('div', { className: 'order-pic' },
      picture ? h('img', { src: picture, alt: '', loading: 'lazy' }) : h('span', { ariaHidden: 'true' }, [...product.title][0]),
      wide && tags),
    h('div', {},
      !wide && tags,
      h('b', { className: 'order-name' }, product.title),
      product.short_description && h('p', {}, product.short_description),
      // A product with variants is ordered as one of them, each on its own line with its own price.
      variants.length
        ? variants.map((v) => h('div', { className: 'order-line' }, price(product, v), stepper(product, v)))
        : h('div', { className: 'order-line' }, price(product), stepper(product))));
}

function drawBar() {
  const lines = [...basket.values()];
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
  bar.hidden = !count;
  if (!count) return;
  const button = (label, pay, kind) => h('button', { className: 'button ' + kind, type: 'button', onclick: (e) => order(pay, e.target) }, label);
  bar.replaceChildren(
    h('span', {}, `${count} ${count === 1 ? T.item : T.items} · ${money(total)}`),
    // An Ortoo with its own gateway takes the money here; every Ortoo takes it at the counter.
    ...(ortoo.takes_payment
      ? [button(T.counter, false, 'button-ghost'), button(T.pay, true, 'button-primary')]
      : [button(T.order, false, 'button-primary')]));
}

// ---- the table: a card's key traded for a session (backend, tables.go) ----

/** The address keeps the session and nothing else: the key is not something to bookmark. */
function keep(s) {
  ({ session, table } = s);
  history.replaceState(null, '', `${location.pathname}?s=${encodeURIComponent(session)}`);
  linkApp();
}

/** The table a session is at while it is live, read off the token. The server checks the rest. */
function sessionTable(s) {
  const [exp, t] = s.split('.');
  if (!t || !(Date.now() / 1000 < Number(exp))) return '';
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
  } catch {
    return '';
  }
}

async function seat() {
  const t = params.get('t')?.trim() ?? '';
  const key = params.get('k');
  if (key) {
    try {
      return keep(await api('POST', `/ortoos/${id}/session`, { table: t, key }));
    } catch {
      // A retired card, or a table the shop took off its list: the menu still opens, at its table.
    }
  }
  if (session) {
    table = sessionTable(session);
    if (!table) [session, ended] = ['', true];
    return;
  }
  // A card printed before keys. A link someone mangled orders without a table rather than not at all.
  table = /^[\p{L}\p{N} ._-]{1,12}$/u.test(t) ? t : '';
}

async function order(pay, button, retried = false) {
  note.hidden = true;
  if (!tokens.get() && !(await signIn())) return;
  const body = { vendor_id: id, ...(session ? { session } : table && { table }), items: [...basket.values()].map(({ price, ...line }) => line) };
  button.disabled = true; // the one thing between a double tap and two tickets in the kitchen
  try {
    // An order keeps the guest at the table for another hour.
    const renew = () => session && api('POST', `/ortoos/${id}/session`, { session }).then(keep, () => {});
    if (!pay) {
      await api('POST', '/orders/claim', body, true);
      renew();
      return done(T.sent, T.sentBody, T.partSoon, ortoo.cycle?.[0]);
    }
    const payment = await api('POST', '/orders', body, true);
    renew();
    const granted = await payFor(payment);
    if (granted) done(T.paid, '', T.part, Object.keys(granted)[0]);
  } catch (e) {
    // The sign-in died between visits: ask again, once, and send the same basket.
    if (e.status === 401 && !retried) return order(pay, button, true);
    // 403: the table session ended, or a QR-only item without one.
    note.textContent = e.status === 429 ? T.tooMany : e.status === 403 ? T.ended : T.failed;
    note.hidden = false;
  } finally {
    button.disabled = false;
  }
}

/** Shows how to pay and waits. Resolves with the parts credited once it is paid, or null. */
async function payFor(payment) {
  let settled = null;
  const status = h('p', { className: 'order-wait' }, T.waiting);
  const check = async () => {
    const p = await api('GET', '/orders/' + payment.id, null, true).catch(() => null);
    if (!p || p.status === 'pending') return;
    if (p.status === 'paid') { settled = p.granted ?? {}; return sheet.close(); }
    status.textContent = T.payFailed;
    status.className = 'order-error';
    clearInterval(timer);
  };
  // Nobody presses "I have paid": the page asks, and asks again the moment it is back from the bank app.
  const timer = setInterval(check, 3000);
  const back = () => document.visibilityState === 'visible' && check();
  document.addEventListener('visibilitychange', back);
  await ask([
    h('h2', {}, `${T.pay} · ${money(payment.amount)}`),
    !!payment.links?.length && h('p', {}, T.bank),
    h('div', { className: 'order-banks' }, (payment.links ?? []).map((l) => h('a', { href: l.link }, l.logo && h('img', { src: l.logo, alt: '' }), l.name))),
    payment.link && h('a', { className: 'button button-primary', href: payment.link, target: '_blank', rel: 'noopener' }, T.page),
    payment.qr_image && h('details', {}, h('summary', {}, T.qr), h('img', { src: 'data:image/png;base64,' + payment.qr_image, alt: 'QR' })),
    status,
    h('button', { className: 'button button-ghost', type: 'button', onclick: () => sheet.close() }, T.cancel),
  ]);
  clearInterval(timer);
  document.removeEventListener('visibilitychange', back);
  return settled;
}

/** The order is in: say so, say what it earns, and point at the app that holds it. */
function done(title, body, partLine, part) {
  basket.clear();
  bar.hidden = true;
  const partName = T.parts[part]; // nothing to say when the day's part was already taken
  main.replaceChildren(h('section', { className: 'order-done card' },
    h('span', { className: 'done-mark', ariaHidden: 'true' }, '✓'),
    h('h1', {}, title),
    table && h('span', { className: 'order-chip' }, `${T.table} ${table}`),
    body && h('p', {}, body),
    partName && h('p', {}, partLine, h('b', {}, partName)),
    h('div', { className: 'order-actions' },
      h('button', { className: 'button button-ghost', type: 'button', onclick: () => location.reload() }, T.again),
      h('a', { className: 'button button-primary', href: app.href }, app.textContent))));
  scrollTo(0, 0);
}

async function load() {
  try {
    await seat();
    const [o, menu] = await Promise.all([api('GET', '/ortoos/' + id),
      api('GET', `/vendors/${id}/products?limit=200` + (session ? '&session=' + encodeURIComponent(session) : ''))]);
    ortoo = o;
    document.title = `${o.name} · Nutag`;
    // A special is lifted out of its section to the strip at the top, so it has one stepper on the page.
    const specials = menu.filter((p) => p.special);
    const sections = new Map();
    for (const p of menu) if (!p.special) sections.set(p.category, [...(sections.get(p.category) ?? []), p]);
    const headed = specials.length > 0 || sections.size > 1;
    const part = T.parts[o.cycle?.[0]];
    main.replaceChildren(...kept([
      h('section', { className: 'order-venue' },
        o.logo_url && h('img', { src: o.logo_url, alt: '' }),
        h('div', {},
          h('h1', {}, o.name),
          h('p', {},
            table && h('span', { className: 'order-chip' }, `${T.table} ${table}`),
            o.open === false && h('span', { className: 'order-chip is-closed' }, T.closed),
            part && h('span', {}, T.today, h('b', {}, part))))),
      ended && h('p', { className: 'order-note' }, T.ended),
      menu.length ? null : h('p', { className: 'order-wait' }, T.empty),
      specials.length > 0 && h('section', { className: 'order-specials' },
        h('h2', {}, T.specials),
        h('ul', {}, specials.map((p) => row(p, true)))),
      [...sections].map(([category, products]) => h('section', {},
        (category || headed) && h('h2', {}, category || T.other),
        h('ul', {}, products.map(row)))),
      note]));
    document.body.append(bar);
  } catch (e) {
    main.replaceChildren(h('section', { className: 'order-done card' },
      h('h1', {}, e.status === 404 || e.status === 422 ? T.missing : T.failed),
      h('div', { className: 'order-actions' }, h('button', { className: 'button button-ghost', type: 'button', onclick: () => location.reload() }, T.retry))));
  }
}
load();
