// The page a table's QR or NFC card opens on a phone without the app: this Ortoo's menu, a basket,
// and an order that reaches the same till the app's orders do. The address is the whole input —
// /o/{ortoo id}?t={table}&k={key} — and a phone with the app sees it only in an in-app browser
// (.well-known/). The key is traded for an hour's table session at once, and the address keeps only
// that (?s=), so a link saved or shared from here stops being at the table an hour after its last order.
//
// Everything a shop typed reaches the page through textContent, never innerHTML: a menu is text
// strangers wrote, shown to strangers.

// On a developer's machine: a local backend, and the fake CIA the console's e2e runs
// (console/e2e/fakecia.mjs) — a page under test must never text a real phone.
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API = local ? 'http://localhost:8080' : 'https://api.nutag.fun';
const CIA = local ? 'http://localhost:9999/api/v1' : 'https://api.cia.mn/api/v1';
const PLAY = 'https://play.google.com/store/apps/details?id=com.nutag.fun';
const APP_STORE = 'https://apps.apple.com/app/id6805935855';

const id = location.pathname.split('/').filter(Boolean)[1] ?? '';
const params = new URLSearchParams(location.search);
let session = params.get('s') ?? ''; // a table session: its table, and the QR-only items, while it is live
let table = '';
let ended = false; // a saved link whose hour is up, or a session the server turned down: nothing is sent

// The language the app would open in (resolveLocale, main.dart): Mongolian on a phone set to it, or
// set to Mongolia whatever its language, English otherwise. The MN | EN switch in the header wins
// over both, in this browser.
function locale() {
  try {
    const chosen = localStorage.getItem('nutag.lang');
    if (chosen === 'mn' || chosen === 'en') return chosen;
  } catch { /* nothing chosen, then */ }
  for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    try {
      const l = new Intl.Locale(tag);
      if (l.language === 'mn' || l.region === 'MN') return 'mn';
      if (l.language === 'en') return 'en';
    } catch { /* not a language tag */ }
  }
  return 'en';
}
let lang = locale();
document.documentElement.lang = lang;
const EN = {
  ended: 'Your table link has ended. Scan the code on your table again.',
  appNeutral: 'Nutag app', getApp: 'Get the app', specials: 'Specials', table: 'Table', today: 'Today here: ', tomorrow: 'Tomorrow: ',
  open: 'Open', closed: 'Closed', openUntil: (t) => `Open · until ${t}`, opensAt: (t) => `Closed · opens at ${t}`,
  opensTomorrow: (t) => `Closed · opens tomorrow at ${t}`, orderComesHere: 'your order comes here',
  noTable: 'No table · collect at the counter', tableOnly: 'Table only', promoUntil: (name, t) => `${name} on until ${t}`, review: 'View basket', basket: 'Your basket',
  clear: 'Empty the basket', payAtCounterNote: 'You pay at the counter',
  empty: 'The menu is empty', other: 'Other', order: 'Order', orderFree: 'Order (free)', pay: 'Pay', counter: 'Pay at the counter',
  phoneTitle: 'Enter your phone number', phoneBody: 'We text a code. The same number signs you in to the Nutag app.',
  phone: 'Phone number', getCode: 'Send code', code: 'Verification code', verify: 'Sign in', cancel: 'Cancel', send: 'Send',
  badPhone: 'That phone number doesn’t look right', badCode: 'That code is wrong or has expired',
  foreignHint: 'Abroad? Type + and the country code', codeSentTo: (phone) => `Enter the 6-digit code sent to ${phone}`,
  changeNumber: 'Use another number', resend: 'Send again', smsLimit: 'Too many codes have been sent today',
  tooManyTries: 'Too many tries — get a new code', add: 'Add', remove: 'Remove',
  terms: (a, b) => ['By continuing you agree to the ', a('Terms of Service'), ' and ', b('Privacy Policy'), '.'],
  sent: 'Order sent', sentBody: 'Staff have your order. Pay at the counter or when it is brought to you.',
  paid: 'Payment went through', part: 'Your part is waiting for you in the Nutag app: ', partSoon: 'One part a day, yours in the Nutag app once staff confirm the order. Today’s here: ',
  again: 'Order more', bank: 'Choose your bank to pay', page: 'Open the payment page', qr: 'Pay by QR from another device',
  waiting: 'Waiting for the payment…', payFailed: 'The payment failed', tooMany: 'You have too many orders waiting here. Please ask the staff.',
  missing: 'This Ortoo was not found', askStaff: 'Please ask the staff', failed: 'Something went wrong. Please try again.', retry: 'Try again',
  loading: 'Loading the menu…', confirmClosed: 'It’s closed right now. Order anyway?',
  close: 'Close', payHint: 'If you have paid, close this and wait — we check for you.',
  checking: 'Checking whether the payment went through', check: 'Check', paidBody: 'Staff have your order.',
  total: 'Total', ref: 'Order #', showStaff: 'show this to staff', yourOrder: 'Your order', stepSent: 'Sent', stepApproved: 'Approved',
  storyLine: 'In the app you can post a story about this Ortoo.', rejected: 'The order was not approved — please ask the staff.',
  parts: { toono: 'Toono', bagana: 'Bagana', khaalga: 'Khaalga', orkh: 'Orkh', esgii: 'Esgii', busluur: 'Busluur', khana: 'Khana', uni: 'Uni' },
};
// \u2011 is a hyphen no line breaks at: "апп-д" split after its hyphen leaves a case ending alone on the next line.
const MN = {
  ended: 'Ширээний холболт дууссан. Ширээн дээрх кодыг дахин уншуулна уу.',
  appNeutral: 'Nutag апп', getApp: 'Апп татах', specials: 'Онцлох', table: 'Ширээ', today: 'Өнөөдөр энд: ', tomorrow: 'Маргааш: ',
  open: 'Нээлттэй', closed: 'Хаалттай', openUntil: (t) => `Нээлттэй · ${t} хүртэл`, opensAt: (t) => `Хаалттай · ${t} цагт нээгдэнэ`,
  opensTomorrow: (t) => `Хаалттай · маргааш ${t} цагт`, orderComesHere: 'захиалга энд ирнэ',
  noTable: 'Ширээгүй · касс дээр авна', tableOnly: 'Ширээнээс', promoUntil: (name, t) => `${name} урамшуулал ${t} хүртэл`, review: 'Сагс харах', basket: 'Таны сагс',
  clear: 'Сагс хоослох', payAtCounterNote: 'Төлбөрөө касс дээр төлнө',
  empty: 'Цэс хоосон байна', other: 'Бусад', order: 'Захиалах', orderFree: 'Захиалах (үнэгүй)', pay: 'Төлөх', counter: 'Касс дээр төлөх',
  phoneTitle: 'Утасны дугаараа оруулна уу', phoneBody: 'Бид код илгээнэ. Nutag апп\u2011д мөн энэ дугаараар нэвтэрнэ.',
  phone: 'Утасны дугаар', getCode: 'Код авах', code: 'Баталгаажуулах код', verify: 'Нэвтрэх', cancel: 'Болих', send: 'Илгээх',
  badPhone: 'Утасны дугаар буруу байна', badCode: 'Код буруу эсвэл хугацаа нь дууссан байна',
  foreignHint: 'Гадаад дугаар бол + болон улсын кодоор', codeSentTo: (phone) => `${phone} дугаарт илгээсэн 6 оронтой кодоо оруулна уу`,
  changeNumber: 'Дугаараа солих', resend: 'Дахин илгээх', smsLimit: 'Өнөөдөр хэт олон код илгээсэн байна',
  tooManyTries: 'Оролдлого хэтэрлээ — шинэ код авна уу', add: 'Нэмэх', remove: 'Хасах',
  terms: (a, b) => ['Үргэлжлүүлснээр та ', a('Үйлчилгээний нөхцөл'), ' болон ', b('Нууцлалын бодлогыг'), ' зөвшөөрнө.'],
  sent: 'Захиалга илгээгдлээ', sentBody: 'Ажилтан таны захиалгыг хүлээн авлаа. Төлбөрөө касс дээр эсвэл ажилтанд төлнө үү.',
  paid: 'Төлбөр амжилттай', part: 'Таны эд анги Nutag апп\u2011д хүлээж байна: ', partSoon: 'Өдөрт нэг эд анги — ажилтан захиалгыг батлангуут Nutag апп\u2011д таных болно. Өнөөдөр энд: ',
  again: 'Дахин захиалах', bank: 'Банкаа сонгож төлнө үү', page: 'Төлбөрийн хуудас нээх', qr: 'Өөр төхөөрөмжөөс QR\u2011аар төлөх',
  waiting: 'Төлбөрийг хүлээж байна…', payFailed: 'Төлбөр амжилтгүй боллоо', tooMany: 'Энд хүлээгдэж буй захиалга олон байна. Ажилтанд хандана уу.',
  missing: 'Ийм Өртөө олдсонгүй', askStaff: 'Ажилтнаас асууна уу', failed: 'Алдаа гарлаа. Дахин оролдоно уу.', retry: 'Дахин оролдох',
  loading: 'Цэс ачаалж байна…', confirmClosed: 'Одоо хаалттай байна. Захиалах уу?',
  close: 'Хаах', payHint: 'Төлсөн бол хаагаад хүлээнэ үү — бид өөрөө шалгана.',
  checking: 'Төлбөр хийсэн эсэхийг шалгаж байна', check: 'Шалгах', paidBody: 'Захиалга тань ажилтанд очлоо.',
  total: 'Нийт', ref: 'Захиалга #', showStaff: 'ажилтанд үзүүлнэ үү', yourOrder: 'Таны захиалга', stepSent: 'Илгээсэн', stepApproved: 'Батлагдсан',
  storyLine: 'Апп\u2011д энэ Өртөөний талаар түүх үлдээж болно.', rejected: 'Захиалга батлагдсангүй — ажилтнаас асууна уу.',
  parts: { toono: 'Тооно', bagana: 'Багана', khaalga: 'Хаалга', orkh: 'Өрх', esgii: 'Эсгий', busluur: 'Бүслүүр', khana: 'Хана', uni: 'Унь' },
};
let T = lang === 'en' ? EN : MN;

const main = document.querySelector('main');
main.querySelector('.order-wait')?.replaceChildren(T.loading); // the skeleton index.html paints first is in Mongolian
const sheet = document.getElementById('sheet');

/** Children as they are written down: nested lists flattened, and `cond && node` dropped when it is not. */
const kept = (kids) => kids.flat().filter((k) => k != null && k !== false && k !== '');

/** h('p', { className: 'x' }, 'text', child) — an element, its properties, its children. */
function h(tag, props, ...kids) {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kept(kids));
  return el;
}

// On Android the link is an intent: the app if it is installed, its Play page if not, so its label
// promises neither. It is also what gets someone out of an in-app browser (a bank's scanner,
// Facebook), where a tapped link never leaves for the app on its own.
const app = document.getElementById('app');
const android = /Android/i.test(navigator.userAgent);
app.textContent = android ? T.appNeutral : T.getApp;
// On iOS it is the App Store, which says "Open" when the app is there. Safari hands /o/* to an installed
// app itself (apple-app-site-association), and its banner (the apple-itunes-app meta) opens it from
// here; an in-app browser does neither. An iPad says Macintosh too, but a Mac has no touch screen.
const ua = navigator.userAgent;
if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) app.href = APP_STORE;
const banner = document.querySelector('meta[name=apple-itunes-app]');
// Again whenever the address changes, so the app is handed the session rather than a spent key.
const linkApp = () => {
  if (banner) banner.content = 'app-id=6805935855, app-argument=' + location.href;
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
// What has to outlive a closed sheet or a reload — the basket, a payment under way, the last order —
// is kept for as long as the tab is open. It can be refused too, and then it lasts as long as the page:
// a payment whose sheet was closed, and a claim's verdict, are still asked after.
const held = {};
const store = {
  get(k) {
    try { return JSON.parse(sessionStorage.getItem(k)); } catch { return held[k] ?? null; }
  },
  set(k, v) {
    held[k] = v;
    try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* held holds it */ }
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
  sheet.querySelector('h2')?.setAttribute('id', 'sheet-title'); // the dialog's name (aria-labelledby)
  sheet.returnValue = '';
  sheet.showModal();
  return new Promise((done) => sheet.addEventListener('close', () => done(sheet.returnValue || undefined), { once: true }));
}

/** Phone, then the code CIA texts it. Resolves true once there are tokens. */
async function signIn() {
  const error = h('p', { className: 'order-error', role: 'alert', hidden: true });
  const fail = (text) => { error.textContent = text; error.hidden = false; };
  // The +976 is printed, not sent: bare digits are a Mongolian number to CIA. A number typed with its
  // own + goes as typed, and the printed one steps aside for it.
  const prefix = h('span', { ariaHidden: 'true' }, '+976');
  const phone = h('input', {
    type: 'tel', name: 'phone', autocomplete: 'tel', inputMode: 'tel', placeholder: '9911 2233',
    oninput: () => { prefix.hidden = phone.value.trimStart().startsWith('+'); },
  });
  const hint = h('p', { className: 'order-hint' }, T.foreignHint);
  const code = h('input', { name: 'code', autocomplete: 'one-time-code', inputMode: 'numeric', maxLength: 6 });
  const sentTo = h('p', {});
  const change = h('button', { type: 'button' }, T.changeNumber);
  const resend = h('button', { type: 'button' }, T.resend);
  const codeRow = h('div', { hidden: true },
    sentTo, h('label', {}, T.code, code), h('div', { className: 'order-otp' }, change, resend));
  const go = h('button', { className: 'button button-primary', type: 'submit' }, T.getCode);
  let identifier = null;

  // The number, or the code sent to it: what changes between the two steps.
  const toCode = (on) => {
    phone.readOnly = on;
    hint.hidden = on;
    codeRow.hidden = !on;
    error.hidden = true;
    go.textContent = on ? T.verify : T.getCode;
  };
  // A new code once a minute at most, counted down on the button: a text can be slow, and a guest
  // who keeps asking spends the day's allowance of them (CIA's daily limit) before the first arrives.
  let timer;
  const ready = () => { clearInterval(timer); resend.disabled = false; resend.textContent = T.resend; };
  const wait = (left = 60) => {
    clearInterval(timer);
    resend.disabled = true;
    const tick = () => (left > 0 ? (resend.textContent = `${T.resend} (${left--})`) : ready());
    tick();
    timer = setInterval(tick, 1000);
  };
  change.onclick = () => {
    identifier = null;
    code.value = '';
    ready();
    toCode(false);
    phone.focus();
  };
  resend.onclick = async () => {
    error.hidden = true;
    resend.disabled = true;
    const r = await cia('/auth/resend', { identifier }).catch(() => null);
    if (r?.ok) {
      wait();
      code.value = '';
      return code.focus();
    }
    ready();
    fail(r?.status === 429 ? T.smsLimit : T.failed);
  };

  // A Terms and a Privacy link, opened beside the sheet rather than over the basket.
  const doc = (path) => (text) => h('a', { href: path + (lang === 'en' ? 'en/' : ''), target: '_blank', rel: 'noopener' }, text);
  // No `required` on either field: the code's is hidden for the first step, and a browser will not
  // submit a form whose invalid field it cannot show. Both are checked below instead.
  const form = h('form', { method: 'dialog' },
    h('h2', {}, T.phoneTitle), h('p', {}, T.phoneBody),
    h('label', {}, T.phone, h('span', { className: 'order-phone' }, prefix, phone)), hint, codeRow, error,
    h('div', { className: 'order-actions' }, h('button', { className: 'button button-ghost', type: 'button', onclick: () => sheet.close() }, T.cancel), go),
    // Getting a code makes a CIA account for a number it has not seen: this is what that agrees to.
    h('p', { className: 'order-terms' }, T.terms(doc('/terms/'), doc('/privacy/'))));
  // Only while the sheet still holds this form: one cancelled mid-request may have given way to the
  // review, and an 'ok' there would send the basket.
  const signedIn = (t) => { tokens.set(t); if (form.isConnected) sheet.close('ok'); };
  form.onsubmit = async (e) => {
    e.preventDefault();
    error.hidden = true;
    go.disabled = true;
    try {
      if (identifier === null) {
        const number = phone.value.replace(/[\s()-]/g, '');
        if (!/^\+?\d{6,15}$/.test(number)) return fail(T.badPhone);
        const r = await cia('/auth/login', { phone: number, delivery_method: 'mt' });
        if (r.status === 400) return fail(T.badPhone);
        if (r.status === 429) return fail(T.smsLimit);
        if (!r.ok) return fail(T.failed);
        const d = await r.json();
        const direct = parse(d.token);
        if (direct) return signedIn(direct);
        identifier = typeof d.identifier === 'string' && d.identifier ? d.identifier : number;
        sentTo.textContent = T.codeSentTo(number.startsWith('+') ? number : '+976\u00a0' + number);
        toCode(true);
        wait();
        code.focus();
      } else {
        const r = await cia('/auth/verify', { identifier, code: code.value.trim() });
        // Too many wrong tries spend the code: only a new one can work now, and it is a tap away.
        if (r.status === 429) {
          ready();
          return fail(T.tooManyTries);
        }
        if (r.status >= 500) return fail(T.failed);
        const t = r.ok ? parse((await r.json()).token) : null;
        if (!t) return fail(T.badCode);
        signedIn(t);
      }
    } catch {
      fail(T.failed);
    } finally {
      go.disabled = false;
    }
  };
  const ok = (await ask([form])) === 'ok';
  clearInterval(timer);
  return ok;
}

// ---- the menu and the basket ----

let ortoo;
const basket = new Map(); // "product|variant" → { product_id, item_id, name, price, qty }
let saved = new Map(); // the basket a reload found, or the one on screen, which each stepper takes its line back from as load() draws it
const money = (n) => (ortoo.currency === 'MNT'
  ? Math.round(n).toLocaleString('en-US') + '₮'
  : new Intl.NumberFormat(undefined, { style: 'currency', currency: ortoo.currency }).format(n));
const bar = h('div', { className: 'order-bar', hidden: true });
const note = h('p', { className: 'order-error', role: 'alert' }); // in the review, or the bar once the seat has ended
let busy = false; // an order on its way: the one thing between a double tap and two tickets in the kitchen
let paying = false; // a payment started here that was last seen pending: the bar says it is being checked

/** The app's openingLine (ortoo.dart): the server's verdict, then the one time that matters now in Ulaanbaatar —
 *  when it closes, or when to come back, later today or tomorrow. The word alone for a shop with no time to
 *  quote, or one whose switch went against its schedule, which says nothing of when it is thrown back. */
function openingLine(o) {
  const status = o.open ? T.open : T.closed;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ulaanbaatar', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const time = `${now.hour}:${now.minute}`;
  // A day the schedule leaves out is a rest day.
  const on = (n) => o.hours?.[days[(days.indexOf(now.weekday.toLowerCase()) + n + 7) % 7]];
  const today = on(0);
  const night = on(-1); // in the small hours the window still running is last night's, when it runs past midnight
  const late = !!night && night.close <= night.open && time < night.close;
  const scheduled = late || (!!today && time >= today.open && (time < today.close || today.close <= today.open));
  if (!Object.keys(o.hours ?? {}).length || scheduled !== o.open) return status;
  if (o.open) return T.openUntil(late ? night.close : today.close);
  if (today && time < today.open) return T.opensAt(today.open);
  return on(1) ? T.opensTomorrow(on(1).open) : status;
}

/** WCAG relative luminance of "#rrggbb"; NaN for anything else, which no contrast test passes. */
function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) return NaN;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** What one of these costs now: the variant's own price, else the product's — its sale price while it has one. */
const priceOf = (product, item) => item?.price ?? product.sale_price ?? product.price;

/** The price as the menu prints it: a sale shows what it was, struck through. */
function price(product, item) {
  const sale = item?.price == null && product.sale_price != null;
  return h('span', { className: 'order-price' }, item && h('span', {}, item.title),
    h('span', {}, sale && h('s', {}, money(product.price)), h('b', { className: sale ? 'is-sale' : '' }, money(priceOf(product, item)))));
}

/** A basket line's −, count and +, on the menu or in the review: every one on the page shows the basket as it is. */
function stepper(key, line) {
  const count = h('output', {});
  const step = (by) => {
    if (busy) return; // the basket on its way is the one on screen
    const qty = Math.min(99, Math.max(0, (basket.get(key)?.qty ?? 0) + by));
    qty ? basket.set(key, { ...line, qty }) : basket.delete(key);
    changed();
  };
  // Nothing in the basket yet: one round "+" to add. The count and "−" open out once there is.
  const box = h('span', { className: 'order-stepper' },
    h('button', { type: 'button', ariaLabel: `${T.remove}: ${line.name}`, onclick: () => step(-1) }, '−'), count,
    h('button', { type: 'button', ariaLabel: `${T.add}: ${line.name}`, onclick: () => step(1) }, '+'));
  box.sync = () => {
    const qty = basket.get(key)?.qty ?? 0;
    count.textContent = qty;
    box.classList.toggle('is-empty', !qty);
  };
  box.sync();
  return box;
}

/** The menu's stepper for a product, or one variant of it: back at the count a reload found, at today's price. */
function menuStepper(product, item) {
  const key = product.id + '|' + (item?.id ?? '');
  const line = { product_id: product.id, ...(item && { item_id: item.id }), name: product.title + (item ? ' · ' + item.title : ''), price: priceOf(product, item) };
  // A line whose product left the menu has no stepper, so it is not taken back.
  const qty = saved.get(key)?.qty;
  if (qty) basket.set(key, { ...line, qty });
  return stepper(key, line);
}

/** After every change to the basket: kept for a reload, and shown by each stepper, the bar and an open review. */
function changed() {
  store.set('nutag.basket.' + id, [...basket]);
  for (const box of document.querySelectorAll('.order-stepper')) box.sync();
  paint?.();
  drawBar();
}

/** A menu line. `wide` is a card in the specials strip, which wants the landscape picture. */
function row(product, wide) {
  const { square, horizontal, vertical } = product.image ?? {};
  const picture = wide ? horizontal || square || vertical : square || horizontal || vertical;
  const variants = product.items ?? [];
  const off = product.sale_price != null && Math.round(100 - (product.sale_price / product.price) * 100);
  // A promotion ending within the day shows when, as a clock and the time, as the app's pill does;
  // the sentence is for a screen reader.
  const ends = product.promo?.until && new Date(product.promo.until);
  const until = ends && ends - Date.now() < 864e5 && ends.toTimeString().slice(0, 5);
  // A QR-only item is the table's: it is said, since it goes from the menu when the seat does.
  const tags = (product.badge || off || product.qr_only) && h('p', { className: 'order-tags' },
    product.qr_only && h('span', { className: 'order-tag is-table' }, T.tableOnly),
    product.badge && h('span', { className: 'order-tag' }, product.badge),
    off && h('span', { className: 'order-tag is-sale' }, `−${off}%`),
    until && h('span', { className: 'order-tag is-until', role: 'img', ariaLabel: T.promoUntil(product.promo.name, until) }, until));
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
        ? variants.map((v) => h('div', { className: 'order-line' }, price(product, v), menuStepper(product, v)))
        : h('div', { className: 'order-line' }, price(product), menuStepper(product))));
}

/** How many, and what they come to. */
function sum() {
  const lines = [...basket.values()];
  return { count: lines.reduce((n, l) => n + l.qty, 0), total: lines.reduce((n, l) => n + l.price * l.qty, 0) };
}

/** One pill, as in the app: the count, and the way to the review that sends it. */
function drawBar() {
  const { count, total } = sum();
  bar.hidden = !count && !paying;
  if (bar.hidden) return;
  // A seat whose hour is up sends nothing: all the bar says is to scan the table again.
  if (ended) note.textContent = T.ended;
  bar.replaceChildren(...kept([
    paying && h('p', { className: 'order-check' }, T.checking,
      h('button', { type: 'button', disabled: busy, onclick: checkPending }, T.check)),
    count > 0 && (ended ? note : h('button', { className: 'button button-primary order-pill', type: 'button', disabled: busy, onclick: openReview },
      h('span', { className: 'badge' }, count), T.review, h('b', {}, money(total))))]));
}

let paint = null; // the open review's totals and buttons, drawn again as its steppers change the basket

/** The basket before it goes: its lines, where it goes, what it earns, and the buttons that send it. */
function review() {
  const rows = [...basket].map(([key, { qty, ...line }]) => ({ key, line, sum: h('b', {}) }));
  const part = T.parts[ortoo.cycle?.[0]];
  const foot = h('div', { className: 'order-review-foot' });
  const send = (label, choice, kind, count) => h('button', { className: 'button ' + kind, type: 'button', disabled: !count, onclick: () => sheet.close(choice) }, label);
  paint = () => {
    const { count, total } = sum();
    for (const r of rows) r.sum.textContent = money(r.line.price * (basket.get(r.key)?.qty ?? 0));
    // An Ortoo with its own gateway takes the money here; every Ortoo takes it at the counter. There a
    // basket that comes to nothing is a claim, as in the app: there is no payment of 0 to make.
    foot.replaceChildren(...(!ortoo.takes_payment
      ? [send(`${T.order} (${count})`, 'claim', 'button-primary', count), h('p', { className: 'order-hint' }, T.payAtCounterNote)]
      : count && !total ? [send(T.orderFree, 'claim', 'button-primary', count)]
        : [send(`${T.pay} · ${money(total)}`, 'pay', 'button-primary', count), send(T.counter, 'claim', 'button-ghost', count)]));
  };
  paint();
  return [
    h('button', { className: 'order-x', type: 'button', ariaLabel: T.close, onclick: () => sheet.close() }, '×'),
    h('h2', {}, T.basket),
    h('p', {}, ortoo.name),
    h('p', { className: 'order-dest' }, table
      ? [h('span', { className: 'order-chip' }, `${T.table} ${table}`), ' ' + T.orderComesHere]
      : h('span', { className: 'order-chip is-plain' }, T.noTable)),
    // A line taken down to 0 stays, with its "+", until the review closes.
    h('ul', { className: 'order-review' }, rows.map((r) => h('li', {},
      h('span', { className: 'order-name' }, r.line.name), h('div', { className: 'order-line' }, r.sum, stepper(r.key, r.line))))),
    h('button', { className: 'button button-ghost order-clear', type: 'button', onclick: () => { basket.clear(); changed(); sheet.close(); } }, T.clear),
    part && h('p', {}, T.partSoon, h('b', {}, part)),
    ortoo.open === false && h('p', { className: 'order-error' }, openingLine(ortoo)),
    // What went wrong with the last send is said here, where it was tapped.
    note.textContent && note,
    foot,
  ];
}

/** The pill's review, the one place an order is sent from. It closes before anything else takes the sheet
 *  (the closed confirm, sign-in, the payment), and opens again on a send that failed, saying why. */
async function openReview() {
  for (;;) {
    const choice = await ask(review());
    paint = null;
    if (!choice) return void (note.textContent = '');
    await order(choice === 'pay');
    if (ended || !note.textContent) return; // sent, or the seat ended and the bar says so
  }
}

// ---- the table: a card's key traded for a session (backend, tables.go) ----

/** The address keeps the session and nothing else: the key is not something to bookmark. */
function keep(s) {
  ({ session, table } = s);
  history.replaceState(null, '', `${location.pathname}?s=${encodeURIComponent(session)}`);
  linkApp();
}

/** Where an order from here goes: this table, the counter, or nowhere until the table's code is scanned again. */
const where = () => (ended ? h('p', { className: 'order-error' }, T.ended)
  : table ? h('p', { className: 'is-table' }, h('b', {}, `${T.table} ${table}`), ' · ' + T.orderComesHere)
  : h('p', {}, T.noTable));

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
  // An ended session is kept: sent, it is refused (403), where an order without it would reach the
  // kitchen with no table.
  if (session) {
    table = sessionTable(session);
    ended = !table;
    return;
  }
  // A card printed before keys. A link someone mangled orders without a table rather than not at all.
  table = /^[\p{L}\p{N} ._-]{1,12}$/u.test(t) ? t : '';
}

/** Sends the basket, one order at a time; at a closed Ortoo, only once the guest says so. */
async function order(pay) {
  if (busy) return;
  busy = true;
  note.textContent = '';
  drawBar();
  try {
    if (ortoo.open === false) {
      const go = await ask([h('h2', {}, T.confirmClosed), h('div', { className: 'order-actions' },
        h('button', { className: 'button button-ghost', type: 'button', onclick: () => sheet.close() }, T.cancel),
        h('button', { className: 'button button-primary', type: 'button', onclick: () => sheet.close('ok') }, T.send))]);
      if (go !== 'ok') return;
    }
    await submit(pay);
  } catch (e) {
    // 403: the table session ended, or a QR-only item without one. Either way it is a rescan.
    if (e.status === 403) {
      ended = true;
      main.querySelector('.order-context > p')?.replaceWith(where());
    } else note.textContent = e.status === 429 ? T.tooMany : T.failed;
  } finally {
    busy = false;
    drawBar();
  }
}

/** Signs in if it has to, and sends. What the server turns down is thrown to order(). */
async function submit(pay, retried = false) {
  if (!tokens.get() && !(await signIn())) return;
  const lines = [...basket.values()];
  const body = { vendor_id: id, ...(session ? { session } : table && { table }), items: lines.map(({ name, price, ...line }) => line) };
  // The receipt, taken now: done() empties the basket, and a reload may have to show it again.
  const sent = {
    lines: lines.map((l) => ({ name: l.name, qty: l.qty, sum: l.price * l.qty })), total: lines.reduce((n, l) => n + l.price * l.qty, 0),
    table, at: Date.now(),
  };
  try {
    // An order keeps the guest at the table for another hour.
    const renew = () => session && api('POST', `/ortoos/${id}/session`, { session }).then(keep, () => {});
    if (!pay) {
      const claim = await api('POST', '/orders/claim', body, true);
      renew();
      const last = { id: claim.id, ...sent };
      store.set('nutag.last.' + id, last);
      return done(false, last, ortoo.cycle?.[0]);
    }
    const payment = await api('POST', '/orders', body, true);
    renew();
    const started = { id: payment.id, ...sent };
    store.set('nutag.pay.' + id, started);
    const granted = await payFor(payment);
    if (!granted) return checkPending();
    store.set('nutag.pay.' + id, null);
    done(true, started, Object.keys(granted)[0]);
  } catch (e) {
    // The sign-in died between visits: ask again, once, and send the same basket.
    if (e.status === 401 && !retried) return submit(pay, true);
    throw e;
  }
}

/** Shows how to pay and waits. Resolves with the parts credited once it is paid, or null. */
async function payFor(payment) {
  let settled = null;
  const status = h('p', { className: 'order-wait', role: 'status' }, T.waiting);
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
    // Closing is not cancelling: the bank may still be taking the money, and the page asks after it.
    h('p', {}, T.payHint),
    h('button', { className: 'button button-ghost', type: 'button', onclick: () => sheet.close() }, T.close),
  ]);
  clearInterval(timer);
  document.removeEventListener('visibilitychange', back);
  return settled;
}

/** Asks after a payment this tab started and lost sight of: its sheet was closed, or the page reloaded. */
async function checkPending() {
  const key = 'nutag.pay.' + id;
  const started = store.get(key);
  if (!started) return;
  let p = null;
  // A checkout lives 15 minutes (DOMAIN §6); after that there is nothing left to wait for.
  if (Date.now() - started.at < 15 * 60e3) {
    try {
      p = await api('GET', '/orders/' + started.id, null, true);
    } catch {
      return; // not reached this time: the next look asks again
    }
  }
  paying = p?.status === 'pending';
  if (!paying) store.set(key, null); // settled: paid is shown below; failed or expired leaves the basket to pay for again
  if (p?.status === 'paid') return done(true, started, Object.keys(p.granted ?? {})[0]);
  drawBar();
}

/** The last claim sent from this tab, while it is worth following: three hours, until the till decides. */
function unsettled() {
  const last = store.get('nutag.last.' + id);
  return last && !last.status && Date.now() - last.at < 3 * 3600e3 ? last : null;
}

/** A claim's two steps, sent and then approved at the till, what it earns, and what the guest can do about either.
 *  `part` is the day's part, promised on the receipt until the till decides; then it says the part credited, if any. */
function progress(last, part) {
  const approved = last.status === 'claimed';
  const got = T.parts[Object.keys(last.granted ?? {})[0]]; // none when the day's part here was already taken
  return h('div', { className: 'order-status' },
    // The filled dot is not read out: aria-current says which step the claim is at.
    h('ol', { className: 'order-steps' },
      h('li', { className: 'is-done', ariaCurrent: approved ? null : 'step' }, T.stepSent),
      h('li', { className: approved ? 'is-done' : '', ariaCurrent: approved ? 'step' : null }, T.stepApproved)),
    approved && h('p', {}, T.storyLine),
    !last.status && T.parts[part] && h('p', {}, T.partSoon, h('b', {}, T.parts[part])),
    got && h('p', {}, T.part, h('b', {}, got)),
    last.status === 'rejected' && h('p', { className: 'order-error' }, T.rejected));
}

/** Asks the till's verdict on the last claim (GET /me/orders), and redraws its steps where they are shown. */
async function follow() {
  const last = unsettled();
  if (!last) return;
  const mine = await api('GET', '/me/orders', null, true).catch(() => null);
  const row = mine?.find((o) => o.id === last.id);
  if (!mine || row?.status === 'awaiting') return;
  // Turning a claim down deletes it (DOMAIN §3): one that is gone was not approved.
  last.status = row ? row.status : 'rejected';
  last.granted = row?.granted;
  store.set('nutag.last.' + id, last);
  main.querySelector('.order-status')?.replaceWith(progress(last));
}

/** What the guest shows staff: the order's last four characters. */
const reference = (r) => h('p', { className: 'order-ref' }, `${T.ref}${r.id.slice(-4).toUpperCase()} — ${T.showStaff}`);

/** The order is in: what was sent and its reference, whether staff have it, what it earns, and the app that holds it. */
function done(paid, r, part) {
  basket.clear();
  store.set('nutag.basket.' + id, null);
  paying = false; // order() redraws the bar after this: only a payment still pending, at the next look, says so again
  bar.hidden = true;
  const partName = T.parts[part]; // nothing to say when the day's part was already taken
  // Focus moves to the heading, so a screen reader says the order is in rather than nothing at all.
  const title = h('h1', { tabIndex: -1 }, paid ? T.paid : T.sent);
  main.replaceChildren(h('section', { className: 'order-done card' },
    h('span', { className: 'done-mark', ariaHidden: 'true' }, '✓'),
    title,
    r.table && h('span', { className: 'order-chip' }, `${T.table} ${r.table}`),
    h('ul', { className: 'order-receipt' },
      r.lines.map((l) => h('li', {}, h('span', {}, `${l.name} ×${l.qty}`), h('span', {}, money(l.sum)))),
      h('li', {}, h('span', {}, T.total), h('span', {}, money(r.total)))),
    reference(r),
    h('p', {}, paid ? T.paidBody : T.sentBody),
    // A settled payment is its own approval (DOMAIN §3): a story is earned now, a claim's once staff approve it.
    paid ? h('p', {}, T.storyLine) : progress(r, part),
    paid && partName && h('p', {}, T.part, h('b', {}, partName)),
    h('div', { className: 'order-actions' },
      h('button', { className: 'button button-ghost', type: 'button', onclick: () => location.reload() }, T.again),
      h('a', { className: 'button button-primary', href: app.href }, app.textContent))));
  scrollTo(0, 0);
  title.focus();
  // The switch draws the menu again, and the receipt (a paid one has nowhere else) would go with it:
  // the switch is hidden, and a menu it already asked for is not drawn.
  document.getElementById('lang').hidden = true;
  loads++;
  clearTimeout(promoEnds); // nor by a promotion ending
  stale = false;
}

/** One section alone, or the whole menu when its chip is pressed again, as the app's chips do
 *  (ortoo.dart). Hidden, not redrawn, so the steppers keep their counts. Deep in a long menu, the
 *  shorter one would leave the guest past its end, so the page goes up to where it starts. */
function pick(i, chip) {
  const on = chip.ariaPressed !== 'true';
  for (const b of chip.parentElement.children) b.ariaPressed = String(on && b === chip);
  const shelves = [...main.querySelectorAll('.order-shelf')];
  shelves.forEach((s, j) => (s.hidden = on && j !== i));
  main.classList.toggle('is-picked', on);
  const first = shelves.find((s) => !s.hidden);
  if (first.getBoundingClientRect().top < chip.closest('.order-context').getBoundingClientRect().bottom) first.scrollIntoView();
}

let loads = 0; // the switch can start a load before the last one is in: only the newest draws, and none over a receipt
let promoEnds; // the timer for the soonest promotion on the menu to end
let stale = false; // one has: the menu is read again at the next look

async function load() {
  const run = ++loads;
  try {
    // Only the menu waits for the seat: its QR-only items come with the session.
    const [o, menu] = await Promise.all([api('GET', '/ortoos/' + id), seat().then(() =>
      api('GET', `/vendors/${id}/products?limit=200` + (session ? '&session=' + encodeURIComponent(session) : '')))]);
    if (run !== loads) return;
    // A running promotion comes beside the sale price and is always below it (backend promotions.go):
    // it is the sale while it runs, so every price, the −% and the basket line read it from there.
    for (const p of menu) if (p.promo) p.sale_price = p.promo.sale_price;
    // Its price holds until it ends; then the menu is read again, so no line and no basket keeps a
    // price the till has stopped charging. Never sooner than 30s (a clock running ahead would loop),
    // never later than a day (a longer timeout overflows).
    clearTimeout(promoEnds);
    const ends = menu.map((p) => Date.parse(p.promo?.until)).filter((t) => t > 0);
    if (ends.length) promoEnds = setTimeout(() => (stale = true), Math.min(864e5, Math.max(30e3, Math.min(...ends) - Date.now())));
    ortoo = o;
    document.title = `${o.name} · Nutag`;
    // The shop's own colour on the accents, as in the app, where it reads (4.5:1) on the page's paper
    // (style.css), which is a shade darker than the app's white cards; white on it then reads too. Not
    // on the dark page: a colour that reads on paper does not read on it, and the page keeps its own light blue.
    const contrast = (luminance('#f5f0e8') + 0.05) / (luminance(o.theme?.primary) + 0.05);
    if (document.documentElement.dataset.theme !== 'dark' && contrast >= 4.5) {
      document.body.style.setProperty('--blue', o.theme.primary); // the bar and the sheet are the shop's too
    }
    // A special is lifted out of its section to the strip at the top, so it has one stepper on the page.
    // The rest go in the app's order (menuSections, api.dart): the menu comes newest first, so the name
    // the shop used first leads, and what has no section comes last.
    const specials = menu.filter((p) => p.special);
    const rest = menu.filter((p) => !p.special);
    const names = [...new Set(rest.map((p) => p.category).reverse().filter(Boolean))];
    if (rest.some((p) => !p.category)) names.push('');
    const shelves = [
      ...(specials.length ? [{ title: T.specials, products: specials, wide: true }] : []),
      ...names.map((name) => ({ title: name || T.other, products: rest.filter((p) => p.category === name), named: !!name })),
    ];
    const headed = shelves.length > 1;
    const part = T.parts[o.cycle?.[0]];
    const next = T.parts[o.cycle?.[1]];
    const last = unsettled();
    saved = new Map(store.get('nutag.basket.' + id) ?? basket); // where the tab keeps nothing, a redraw still has it
    basket.clear();
    main.classList.remove('is-picked'); // a redraw starts with every chip up
    main.replaceChildren(...kept([
      o.banner_url && h('img', { className: 'order-banner', src: o.banner_url, alt: '' }),
      h('section', { className: 'order-venue' },
        // The app's face for a venue (OrtooLogo): the logo in a circle, or the name's first letter in one.
        o.logo_url ? h('img', { src: o.logo_url, alt: '' }) : h('span', { className: 'order-mono', ariaHidden: 'true' }, [...o.name][0]?.toUpperCase()),
        h('div', {},
          h('h1', {}, o.name),
          o.open != null && h('p', { className: o.open ? 'is-open' : 'is-closed' }, openingLine(o)),
          // What a visit gives, today and tomorrow, before anything is ordered (DOMAIN §3).
          part && h('p', {}, T.today, h('b', {}, part), next && [' · ', T.tomorrow, h('b', {}, next)]))),
      // Pinned while the menu scrolls under it: where an order goes, and a chip per section.
      h('div', { className: 'order-context' }, where(),
        headed && h('nav', { className: 'order-nav' }, shelves.map((s, i) => h('button', {
          type: 'button', ariaPressed: 'false', onclick: (e) => pick(i, e.currentTarget),
        }, s.title)))),
      // Back after a reload, or for another round: the order still waiting on the till, and how it stands.
      last && h('section', { className: 'order-mine card' },
        h('h2', {}, T.yourOrder, h('span', {}, money(last.total))), reference(last), progress(last)),
      menu.length ? null : h('p', { className: 'order-wait' }, T.empty),
      shelves.map((s) => h('section', { className: s.wide ? 'order-shelf order-specials' : 'order-shelf' },
        (s.wide || s.named || headed) && h('h2', {}, s.title),
        h('ul', {}, s.products.map((p) => row(p, s.wide)))))]));
    document.body.append(bar);
    changed(); // kept as this menu took it back: a line it dropped does not return with a later menu
    checkPending();
    follow();
  } catch (e) {
    if (run !== loads) return;
    // An Ortoo that is not there will not be after a retry: the staff can say where the guest is, and
    // the app has the map of the Ortoos that are (the site's /map/ is the city, with none on it).
    const gone = e.status === 404 || e.status === 422;
    main.replaceChildren(h('section', { className: 'order-done card' },
      h('h1', {}, gone ? T.missing : T.failed),
      gone && h('p', {}, T.askStaff),
      h('div', { className: 'order-actions' }, gone
        ? h('a', { className: 'button button-ghost', href: app.href }, app.textContent)
        : h('button', { className: 'button button-ghost', type: 'button', onclick: () => location.reload() }, T.retry))));
  } finally {
    main.removeAttribute('aria-busy');
  }
}
load();

// MN | EN in the header: kept for this browser, and the page drawn again in it, basket and all. Read
// out, like the home page's EN link, as the language it goes to, in that language.
const switcher = document.getElementById('lang');
const nameSwitch = () => Object.assign(switcher,
  lang === 'en' ? { lang: 'mn', ariaLabel: 'MN, Монгол' } : { lang: 'en', ariaLabel: 'EN, English' });
nameSwitch();
switcher.onclick = () => {
  if (busy) return; // the order on its way finishes in the language it started in
  lang = lang === 'en' ? 'mn' : 'en';
  try { localStorage.setItem('nutag.lang', lang); } catch { /* for this visit, then */ }
  T = lang === 'en' ? EN : MN;
  document.documentElement.lang = lang;
  app.textContent = android ? T.appNeutral : T.getApp;
  note.textContent = '';
  nameSwitch();
  load();
};

// Nobody has to press "I have paid" or reload to see a verdict: a payment and a claim still open are
// asked after every 15 seconds while the page is in front, and the moment it is back from a bank app.
// Never under a sheet or a send, which ask for themselves, nor before there is a menu.
// A promotion that has ended draws the menu again here, for the same reasons: never under a sheet or a send.
const look = () => {
  if (!ortoo || busy || sheet.open || document.visibilityState !== 'visible') return;
  if (stale) return (stale = false), load();
  checkPending();
  follow();
};
setInterval(look, 15e3);
document.addEventListener('visibilitychange', look);
