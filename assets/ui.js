// Presentation: heading line reveals, scroll reveals, header state, nav spy, mobile CTA bar.
(() => {
'use strict';
const $$ = s => [...document.querySelectorAll(s)];

// mask each heading line so it slides up into place
$$('[data-lines] > span').forEach(s => { s.innerHTML = `<i>${s.innerHTML}</i>`; });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  io.unobserve(e.target);
}), { rootMargin: '0px 0px -8% 0px' });
$$('[data-reveal], [data-lines]').forEach((el, i) => {
  if (el.matches('[data-reveal]')) el.style.transitionDelay = `${(i % 3) * 70}ms`;
  io.observe(el);
});

// scroll-progress neon line: native scroll timeline where supported, JS otherwise
const line = document.querySelector('.scrollline');
if (line && !CSS.supports('animation-timeline: scroll()')) {
  const set = () => { const max = document.documentElement.scrollHeight - innerHeight; line.style.setProperty('--p', max > 0 ? scrollY / max : 0); };
  addEventListener('scroll', set, { passive: true }); addEventListener('resize', set); set();
}

// header gets a hairline once the page moves
const hdr = document.querySelector('.hdr');
// full-bleed hero tucks under the header: expose its height to CSS
new ResizeObserver(() => document.documentElement.style.setProperty('--hh', hdr.offsetHeight + 'px')).observe(hdr);
const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// highlight the nav item for the section in view
const links = $$('.hdr__nav a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach(s => spy.observe(s));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// hero highlight: scramble-decode between words, like tbd. Each letter shows random glyphs,
// then locks in at its own random moment; the length eases from old word to new.
const scr = document.querySelector('[data-scramble]');
if (scr && !reduce) {
  const words = scr.dataset.scramble.split('|');
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>_/[]{}=+*^?#';
  const HOLD = 1600, SETTLE = 600, FRAME = 1000 / 22;             // ms; ~22 fps glyph churn
  const rnd = () => GLYPHS[Math.random() * GLYPHS.length | 0];
  const ease = t => t * t * (3 - 2 * t);
  let cur = 0, nxt = 0, busy = false, t0 = performance.now() + 600, lock = [];
  const tick = () => {
    const now = performance.now();
    if (!busy) {
      if (now - t0 >= HOLD) {                                       // start next swap
        nxt = (cur + 1) % words.length; busy = true; t0 = now;
        const n = Math.max(words[cur].length, words[nxt].length);
        lock = Array.from({ length: n }, () => SETTLE * (.15 + Math.random() * .85));
      }
    } else {
      const el = now - t0, k = Math.min(el / SETTLE, 1), to = words[nxt];
      const len = Math.max(1, Math.round(words[cur].length + (to.length - words[cur].length) * ease(k)));
      let out = '';
      for (let j = 0; j < len; j++) out += j < to.length && el >= lock[j] ? to[j] : rnd();
      scr.dataset.hlx = out;
      if (k >= 1) { scr.dataset.hlx = to; scr.firstElementChild.textContent = to; cur = nxt; busy = false; t0 = now; }
    }
  };
  setInterval(tick, FRAME);   // ponytail: a timer, not rAF; the effect is a deliberate ~22fps churn
}

// big stats count up from 0 when they enter view
const counter = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  counter.unobserve(e.target);
  const el = e.target, to = Number(el.dataset.count), sup = el.querySelector('sup')?.outerHTML || '';
  if (reduce || !to) return;
  const t0 = performance.now(), dur = 1200;
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur);
    el.innerHTML = Math.round(to * (1 - Math.pow(1 - k, 3))) + sup;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // if frames get throttled (background tab), still land on the real number
  setTimeout(() => { el.innerHTML = to + sup; }, dur + 400);
}), { threshold: .4 });
$$('[data-count]').forEach(el => counter.observe(el));

// brand mark in the mission block drifts with scroll
const mark = document.querySelector('.mission__mark');
if (mark && !reduce) {
  const move = () => {
    const r = mark.getBoundingClientRect(), p = (r.top + r.height / 2) / innerHeight - .5;
    if (Math.abs(p) < 1.2) mark.style.transform = `translateY(${p * -40}px) scale(${1 - Math.abs(p) * .12})`;
  };
  addEventListener('scroll', () => requestAnimationFrame(move), { passive: true }); move();
}

// currency marquee: duplicate once so the -50% loop is seamless
const track = document.querySelector('[data-marquee]');
if (track) { [...track.children].forEach(c => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); track.appendChild(d); }); }

// app widgets show live crypto prices published by main.js
addEventListener('hrates', ({ detail: { rates, change24 } }) => {
  $$('[data-price]').forEach(el => {
    const usd = 1 / rates[el.dataset.price];
    el.textContent = '$' + usd.toLocaleString('en-US', { maximumFractionDigits: usd > 100 ? 0 : 4 });
  });
  $$('[data-chg]').forEach(el => {
    const c = change24[el.dataset.chg];
    el.textContent = c == null ? '' : `${c >= 0 ? '▲' : '▼'} ${Math.abs(c).toFixed(2)}%`;
    el.className = c == null ? '' : c >= 0 ? 'up' : 'down';
  });
});

// network status panel: live mid rates per corridor, flash when they change
addEventListener('hrates', ({ detail: { rates } }) => {
  $$('[data-pair]').forEach(el => {
    const [a, b] = el.dataset.pair.split(':');
    if (!rates[a] || !rates[b]) return;
    const r = rates[b] / rates[a];
    const txt = r.toLocaleString('en-US', { minimumFractionDigits: r > 100 ? 2 : 4, maximumFractionDigits: r > 100 ? 2 : 4 });
    if (el.textContent !== txt) { el.textContent = txt; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  });
});
// USD/HKD sits inside the Linked Exchange Rate band (7.75–7.85): place the marker
addEventListener('hrates', ({ detail: { rates } }) => {
  const m = document.querySelector('[data-band]');
  if (m && rates.HKD) m.style.left = `${Math.min(100, Math.max(0, (rates.HKD - 7.75) / 0.10 * 100))}%`;
});

// 24h sparklines for the crypto market cards (CoinGecko, free tier)
$$('[data-spark]').forEach(async card => {
  try {
    const d = await (await fetch(`https://api.coingecko.com/api/v3/coins/${card.dataset.spark}/market_chart?vs_currency=usd&days=1`)).json();
    const p = d.prices.map(x => x[1]);
    const lo = Math.min(...p), hi = Math.max(...p), W = 300, H = 70, pad = 4;
    const pts = p.map((v, i) => [i / (p.length - 1) * W, H - pad - (v - lo) / (hi - lo || 1) * (H - pad * 2)]);
    const line = 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
    card.querySelector('.spark__line').setAttribute('d', line);
    card.querySelector('.spark__fill').setAttribute('d', `${line}L${W},${H}L0,${H}Z`);
  } catch (e) { card.querySelector('.spark').style.display = 'none'; }   // card still shows price
});

const clock = document.querySelector('[data-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const top = document.querySelector('[data-clock-top]');
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hong_Kong', month: 'long', day: 'numeric' });
  const tickClock = () => {
    const now = new Date();
    clock.textContent = `${fmt.format(now)} HKT`;
    if (top) top.textContent = `${day.format(now)}, ${fmt.format(now).slice(0, 5)} HKT`;
    const rail = document.querySelector('[data-clock-rail]');
    if (rail) rail.textContent = `${day.format(now)} · ${fmt.format(now).slice(0, 5)} HKT`;
  };
  tickClock(); setInterval(tickClock, 1000);
}

// store badges: apps aren't published yet — say so instead of a dead link
const toast = document.querySelector('[data-toast]');
let toastTimer;
document.addEventListener('click', e => {
  const s = e.target.closest('[data-store]'); if (!s) return;
  e.preventDefault();
  toast.hidden = false; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
});

// mobile: sticky CTA appears once the hero (and its own CTAs) have scrolled away
const bar = document.querySelector('[data-mbar]'), hero = document.querySelector('.hero');
if (bar && hero) new IntersectionObserver(([e]) => {
  bar.classList.toggle('show', !e.isIntersecting);
  bar.setAttribute('aria-hidden', String(e.isIntersecting));
  bar.querySelector('a').tabIndex = e.isIntersecting ? -1 : 0;
}).observe(hero);
})();
