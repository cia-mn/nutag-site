// Theme toggle, mobile menu and scroll reveals, shared by every page. Which theme to start in is
// decided by the inline script in <head>, before first paint; this only flips and remembers it.
// One block, so nothing here collides with another classic script's top-level names (vendor/form.js).
{
  const root = document.documentElement;
  // Reveals hide their targets until scrolled to, so the class that arms them is set here, not in
  // <head>: if this file ever fails to load, the page simply shows everything.
  root.classList.add('has-js');

  const toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    const sync = () => {
      const dark = root.dataset.theme === 'dark';
      const label = dark ? toggle.dataset.toLight : toggle.dataset.toDark;
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
      toggle.setAttribute('aria-pressed', String(dark));
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#14120f' : '#f5f0e8'));
    };
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('nutag-theme', root.dataset.theme); } catch {}
      sync();
    });
    sync();
  }

  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (header && navToggle && mobileNav) {
    const setOpen = open => {
      header.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? navToggle.dataset.closeLabel : navToggle.dataset.openLabel);
      mobileNav.inert = !open;
      document.body.classList.toggle('nav-locked', open);
      if (open) requestAnimationFrame(() => mobileNav.querySelector('a')?.focus());
    };
    navToggle.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
    mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !header.classList.contains('menu-open')) return;
      setOpen(false);
      navToggle.focus();
    });
    matchMedia('(min-width: 821px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -40px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }
}
