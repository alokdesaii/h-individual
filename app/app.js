// H Individual web app — shared behaviour. No dependencies.
// BACKEND: everything here is UI-only; swap in real data where pages mark `data-api`.

// Mobile rail: [data-nav-toggle] opens, backdrop click / Esc closes.
const app = document.querySelector('.app');
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav-toggle]')) app?.classList.toggle('nav-open');
  else if (app?.classList.contains('nav-open') && !e.target.closest('.side')) app.classList.remove('nav-open');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') app?.classList.remove('nav-open'); });

// Mark the current page in rail + tab bar (pages can also set aria-current by hand).
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a, .tabbar a').forEach(a => {
  if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
});

// Toasts: toast('Saved') or toast('Failed', 'err'). Also [data-toast="msg"] on any button.
window.toast = (msg, kind = '') => {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' toast--' + kind : '');
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.remove(), 4000);
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-toast]');
  if (b) toast(b.dataset.toast, b.dataset.toastKind);
});

// Dialogs: [data-open="id"] shows <dialog id>, [data-close] inside closes it.
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) document.getElementById(o.dataset.open)?.showModal();
  const c = e.target.closest('[data-close]');
  if (c) c.closest('dialog')?.close();
});

// OTP boxes: auto-advance, backspace goes back, paste fills all.
document.querySelectorAll('.otp').forEach(g => {
  const ins = [...g.querySelectorAll('input')];
  ins.forEach((i, n) => {
    i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, '').slice(-1); if (i.value) ins[n + 1]?.focus(); });
    i.addEventListener('keydown', e => { if (e.key === 'Backspace' && !i.value) ins[n - 1]?.focus(); });
    i.addEventListener('paste', e => {
      const d = e.clipboardData.getData('text').replace(/\D/g, '');
      if (!d) return;
      e.preventDefault();
      ins.forEach((x, k) => x.value = d[k] || '');
      ins[Math.min(d.length, ins.length) - 1].focus();
    });
  });
});
