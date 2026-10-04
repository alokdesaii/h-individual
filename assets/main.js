// H Individual landing — converter, live rates, two-step sign-up.
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
$$('[data-year]').forEach(e => { e.textContent = new Date().getFullYear(); });

/* ── currencies ─────────────────────────────────────────────────── */
const CUR = {
  USD: ['🇺🇸', 'US Dollar', 'the US'], EUR: ['🇪🇺', 'Euro', 'Europe'], GBP: ['🇬🇧', 'British Pound', 'the UK'],
  HKD: ['🇭🇰', 'Hong Kong Dollar', 'Hong Kong'], SGD: ['🇸🇬', 'Singapore Dollar', 'Singapore'], AED: ['🇦🇪', 'UAE Dirham', 'the UAE'],
  INR: ['🇮🇳', 'Indian Rupee', 'India'], PHP: ['🇵🇭', 'Philippine Peso', 'the Philippines'], NGN: ['🇳🇬', 'Nigerian Naira', 'Nigeria'],
  CNY: ['🇨🇳', 'Chinese Yuan', 'China'], JPY: ['🇯🇵', 'Japanese Yen', 'Japan'], AUD: ['🇦🇺', 'Australian Dollar', 'Australia'],
  CAD: ['🇨🇦', 'Canadian Dollar', 'Canada'], IDR: ['🇮🇩', 'Indonesian Rupiah', 'Indonesia'],
};
const CRYPTO = { USDC: ['◎', 'USD Coin', 'usd-coin'], USDT: ['₮', 'Tether', 'tether'], BTC: ['₿', 'Bitcoin', 'bitcoin'], ETH: ['Ξ', 'Ether', 'ethereum'] };
const isCrypto = c => c in CRYPTO;

// Units per 1 USD. Fallback until live data arrives or if a provider is down.
const rates = { USD: 1, EUR: 0.92, GBP: 0.78, HKD: 7.81, SGD: 1.34, AED: 3.6725, INR: 83.4, PHP: 57.5, NGN: 1550, CNY: 7.2, JPY: 148, AUD: 1.52, CAD: 1.36, IDR: 16300,
  BTC: 1 / 84000, ETH: 1 / 2650, USDC: 1, USDT: 1 };
let fiatTime = null, cryptoTime = null;
const change24 = {};                              // crypto 24h % change, for the app widgets

const FEE = { fiat: 0.005, crypto: 0.01 };        // matches the pricing table
const BANK_EST = 0.03;                            // rough cost of a typical bank transfer, for the comparison line
const LIMIT = { min: 10, max: 50000 };            // in USD equivalent
const ETA = { bank: 'Usually within 1 hour', wallet: 'Usually within minutes', crypto: 'Usually within minutes' };

/* ── converter ──────────────────────────────────────────────────── */
const sendEl = $('#fx-amount'), getEl = $('#fx-out'), fromEl = $('#fx-from'), toEl = $('#fx-to');
const feeEl = $('[data-fee]'), netEl = $('[data-net]'), rateEl = $('[data-rate]'), etaEl = $('[data-eta]'), totalEl = $('[data-total]');
const compareEl = $('[data-compare]'), updatedEl = $('[data-updated]'), liveEl = $('[data-live]'), errEl = $('#fx-err');
const ctaBtn = $('[data-fx-cta]'), ctaLabel = $('[data-cta-label]');

const opts = () =>
  `<optgroup label="Currencies">${Object.entries(CUR).map(([c, [f, n]]) => `<option value="${c}">${f} ${c} · ${n}</option>`).join('')}</optgroup>` +
  `<optgroup label="Crypto">${Object.entries(CRYPTO).map(([c, [f, n]]) => `<option value="${c}">${f} ${c} · ${n}</option>`).join('')}</optgroup>`;
fromEl.innerHTML = opts(); toEl.innerHTML = opts();
fromEl.value = 'USD'; toEl.value = 'INR';
// show just "🇺🇸 USD" in the closed select; full names stay in the list
function shortLabels(sel) { [...sel.options].forEach(o => { o.dataset.full ||= o.textContent; o.textContent = o.selected ? o.dataset.full.split(' · ')[0] : o.dataset.full; }); }

const digits = c => (c === 'BTC' || c === 'ETH') ? 6 : c === 'JPY' ? 0 : 2;
const fmt = (n, c) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: digits(c), maximumFractionDigits: digits(c) }) : '—';
const money = (n, c) => {
  if (isCrypto(c)) return `${fmt(n, c)} ${c}`;
  try { return n.toLocaleString('en-US', { style: 'currency', currency: c, maximumFractionDigits: digits(c) }); } catch { return `${fmt(n, c)} ${c}`; }
};
const num = el => { const n = parseFloat(el.value.replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
const rate = (a, b) => rates[b] / rates[a];
const method = () => $('input[name=method]:checked').value;
let driver = 'send';                              // which field the user last typed in
let lastFiatTo = 'INR';

function calc() {
  const from = fromEl.value, to = toEl.value, r = rate(from, to);
  const crypto = isCrypto(from) || isCrypto(to) || method() === 'crypto';
  const feeRate = from === to ? 0 : crypto ? FEE.crypto : FEE.fiat;
  let send, get;
  if (driver === 'send') { send = num(sendEl); get = send * (1 - feeRate) * r; getEl.value = send ? fmt(get, to) : ''; }
  else { get = num(getEl); send = get / r / (1 - feeRate); sendEl.value = get ? fmt(send, from) : ''; }
  const fee = send * feeRate;
  feeEl.textContent = money(fee, from);
  netEl.textContent = money(send - fee, from);
  rateEl.textContent = r >= 1 ? `1 ${from} = ${r.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${to}`
                              : `1 ${to} = ${(1 / r).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${from}`;
  etaEl.textContent = ETA[method()];
  totalEl.textContent = money(fee, from);

  // validation, in USD terms so limits work for every currency
  const usd = send / rates[from];
  let err = '';
  if (!send) err = 'Enter an amount to see your quote.';
  else if (usd < LIMIT.min) err = `The minimum is about ${money(LIMIT.min * rates[from], from)}.`;
  else if (usd > LIMIT.max) err = `During early access the maximum per transfer is about ${money(LIMIT.max * rates[from], from)}.`;
  else if (from === to) err = 'Choose two different currencies.';
  errEl.hidden = !err; errEl.textContent = err;
  $(`[data-field="${driver}"]`).classList.toggle('bad', !!err && !!send);
  ctaBtn.disabled = !!err;
  ctaBtn.style.opacity = err ? .5 : 1;

  const save = send * (BANK_EST - feeRate);
  compareEl.textContent = !err && !crypto && save > 0
    ? `About ${money(save, from)} less than a typical bank transfer (estimate).` : '';
  const dest = CUR[to]?.[2];
  ctaLabel.textContent = err ? 'Continue' : dest ? `Send ${money(get, to)} to ${dest}` : `Get ${money(get, to)}`;
  ctaBtn.dataset.summary = err ? '' : `${money(send, from)} → ${money(get, to)}${dest ? ` to ${dest}` : ''}, via ${method() === 'bank' ? 'bank account' : method() === 'wallet' ? 'mobile wallet' : 'crypto wallet'}`;
  shortLabels(fromEl); shortLabels(toEl);
}

sendEl.addEventListener('input', () => { driver = 'send'; calc(); });
getEl.addEventListener('input', () => { driver = 'get'; calc(); });
[sendEl, getEl].forEach(el => el.addEventListener('blur', () => {
  const c = el === sendEl ? fromEl.value : toEl.value, n = num(el);
  el.value = n ? fmt(n, c) : '';
}));
[fromEl, toEl].forEach(el => el.addEventListener('focus', () => [...el.options].forEach(o => { if (o.dataset.full) o.textContent = o.dataset.full; })));
fromEl.addEventListener('change', calc);
toEl.addEventListener('change', () => {
  if (!isCrypto(toEl.value)) lastFiatTo = toEl.value;
  // keep delivery method consistent with what's being received
  if (isCrypto(toEl.value)) $('input[value=crypto]').checked = true;
  else if (method() === 'crypto') $('input[value=bank]').checked = true;
  calc();
});
$$('input[name=method]').forEach(r => r.addEventListener('change', () => {
  if (method() === 'crypto' && !isCrypto(toEl.value)) toEl.value = 'USDC';
  if (method() !== 'crypto' && isCrypto(toEl.value)) toEl.value = lastFiatTo;
  calc();
}));
$('#fx-swap').addEventListener('click', () => {
  [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  if (!isCrypto(toEl.value)) lastFiatTo = toEl.value;
  if (isCrypto(toEl.value)) $('input[value=crypto]').checked = true; else if (method() === 'crypto') $('input[value=bank]').checked = true;
  calc();
});
$('#fx').addEventListener('submit', e => e.preventDefault());

/* ── rates strip ────────────────────────────────────────────────── */
const PAIRS = [['USD', 'INR'], ['AED', 'INR'], ['HKD', 'PHP'], ['USD', 'HKD'], ['GBP', 'NGN'], ['SGD', 'INR'], ['EUR', 'USD'], ['USDC', 'PHP'], ['BTC', 'USD'], ['ETH', 'USD']];
const strip = $('[data-rates]');
function renderStrip() {
  strip.innerHTML = PAIRS.map(([a, b]) => {
    const r = rate(a, b);
    return `<button type="button" class="rate" data-a="${a}" data-b="${b}" aria-label="Load ${a} to ${b} into the converter"><b>${a} → ${b}</b><span>${r.toLocaleString('en-US', { maximumFractionDigits: r > 100 ? 2 : 4 })}</span></button>`;
  }).join('');
}
strip.addEventListener('click', e => {
  const b = e.target.closest('.rate'); if (!b) return;
  fromEl.value = b.dataset.a; toEl.value = b.dataset.b; toEl.dispatchEvent(new Event('change'));
  driver = 'send'; calc();
  $('#fx').scrollIntoView({ behavior: 'smooth', block: 'center' });
  sendEl.focus({ preventScroll: true });
});

function paintStatus() {
  const live = fiatTime || cryptoTime;
  liveEl.classList.toggle('on', !!live);
  liveEl.lastChild.textContent = live ? 'Live' : 'Indicative';
  const p = [];
  if (fiatTime) p.push(`Currencies as of ${fiatTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`);
  if (cryptoTime) p.push(`crypto ${cryptoTime.toLocaleTimeString([], { timeStyle: 'short' })}`);
  updatedEl.textContent = p.length ? `${p.join(' · ')}. Indicative mid-market rates.` : 'Indicative rates — live data unavailable.';
}

/* ── data ───────────────────────────────────────────────────────── */
async function loadFiat() {
  try {
    const d = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
    if (d.result !== 'success') throw new Error(d['error-type']);
    Object.keys(CUR).forEach(c => { if (d.rates[c]) rates[c] = d.rates[c]; });
    fiatTime = new Date(d.time_last_update_unix * 1000);
  } catch (err) { console.warn('[rates] fiat unavailable, using fallback', err); }
}
async function loadCrypto() {
  try {
    const ids = Object.values(CRYPTO).map(v => v[2]).join(',');
    const d = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)).json();
    Object.entries(CRYPTO).forEach(([s, v]) => { if (d[v[2]]?.usd) rates[s] = 1 / d[v[2]].usd; if (d[v[2]]?.usd_24h_change != null) change24[s] = d[v[2]].usd_24h_change; });
    cryptoTime = new Date();
  } catch (err) { console.warn('[rates] crypto unavailable, using fallback', err); }
}
// widgets elsewhere on the page listen for this
const refresh = () => { calc(); renderStrip(); paintStatus(); dispatchEvent(new CustomEvent('hrates', { detail: { rates, change24, live: !!(fiatTime || cryptoTime) } })); };
refresh();
Promise.all([loadFiat(), loadCrypto()]).then(refresh);
// ponytail: polls the free CoinGecko tier; move behind our own quote API before launch
setInterval(() => { if (!document.hidden) loadCrypto().then(refresh); }, 60000);

/* ── sign-up: two steps ─────────────────────────────────────────── */
const dlg = $('#signup'), form = $('#signup-form');
const steps = { 1: $('[data-step="1"]'), 2: $('[data-step="2"]'), done: $('[data-step="done"]') };
const stepLabel = $('[data-step-label]'), summary = $('[data-signup-summary]'), title = $('#signup-title');
function show(step) {
  Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== String(step); });
  stepLabel.textContent = step === 'done' ? 'All set' : `Step ${step} of 2`;
  steps[step].querySelector('input,select,button')?.focus();
}
const bad = (el, on) => el.closest('.fld')?.classList.toggle('bad', on);
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-signup]'); if (!t) return;
  e.preventDefault();
  if (t.disabled) return;
  form.reset(); $$('.fld.bad').forEach(f => f.classList.remove('bad')); $('.fld__err--terms').classList.remove('show');
  const login = t.dataset.signup === 'login';
  title.textContent = login ? 'Log in is coming soon' : 'Create your personal account';
  $('[data-signup-sub]').textContent = login ? 'Accounts open during early access. Create one now and we\'ll invite you in.' : 'For individuals. Free to open, no card needed.';
  summary.hidden = !t.dataset.summary;
  summary.textContent = t.dataset.summary ? `Your quote: ${t.dataset.summary}` : '';
  show(1);
  dlg.showModal();
});
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
form.email.addEventListener('input', () => bad(form.email, false));
$('[data-next]').addEventListener('click', () => {
  const ok = validEmail(form.email.value.trim());
  bad(form.email, !ok);
  if (ok) show(2);
});
form.email.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('[data-next]').click(); } });
$('[data-back]').addEventListener('click', () => show(1));
$('[data-close]').addEventListener('click', () => dlg.close());
// ponytail: no backend yet — POST { email, name, country, quote } to /api/signup when the account service exists
form.addEventListener('submit', e => {
  e.preventDefault();
  const n = form.name.value.trim().length > 1, c = !!form.country.value, t = form.terms.checked;
  bad(form.name, !n); bad(form.country, !c); $('.fld__err--terms').classList.toggle('show', !t);
  if (!(n && c && t)) return;
  $('[data-email]').textContent = form.email.value.trim();
  show('done');
});
})();
