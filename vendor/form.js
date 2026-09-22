// The "become an Ortoo" stepper: one fieldset at a time. Every step's button is a submit button,
// so Enter and the button do the same thing — validate this step, then move on; the last step
// posts the whole form. Fields in hidden steps stay in the FormData, which is the point.
const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8080' : 'https://api.nutag.fun';
const form = document.getElementById('apply');
const steps = [...form.querySelectorAll('fieldset')];
const done = steps.length - 1, last = done - 1;
let at = 0;

function show(n) {
  steps[at].hidden = true;
  at = n;
  steps[at].hidden = false;
  window.scrollTo(0, 0);
  steps[at].querySelector('input, select, textarea')?.focus();
}

form.addEventListener('click', e => {
  if (e.target.closest('.back')) show(at - 1);
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  // every() stops at the first invalid field, so the browser shows one bubble, not five.
  if (![...steps[at].elements].every(el => el.reportValidity())) return;
  if (at < last) return show(at + 1);

  const buttons = [...steps[at].querySelectorAll('button')];
  const error = form.querySelector('.error');
  buttons.forEach(b => (b.disabled = true));
  error.hidden = true;
  const body = Object.fromEntries(new FormData(form));
  try {
    const r = await fetch(API + '/vendor-applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(String(r.status));
    form.querySelector('[data-phone]').textContent = body.phone;
    show(done);
  } catch {
    error.hidden = false;
  } finally {
    buttons.forEach(b => (b.disabled = false));
  }
});
