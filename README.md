<div align="center">

<img src="assets/logo-light.svg" alt="H Individual" width="140">

# H Individual

**One World. One Money.**

Send, hold and convert dollars, rupees, dirhams and crypto at the real exchange rate — on the web and in the H Individual app.

[Live site](https://h-individual.vercel.app) · [Harbour & Hills](https://www.harbourandhills.com/hk/index.html)

</div>

---

## About

H Individual is the personal cross-border payments product from **Harbour & Hills**, a Hong Kong payments company. This repository holds the marketing and early-access landing page: a fast, dependency-free static site built to turn visitors into account sign-ups.

The page is designed around one job — show people exactly what their transfer will cost, then make it effortless to start.

## Highlights

| | |
|---|---|
| **Live converter** | Two-way fiat ⇄ fiat ⇄ crypto quote with fee, mid-market rate, delivery method (bank, mobile wallet, crypto wallet), arrival estimate and bank-cost comparison. |
| **Real market data** | Fiat rates from open.er-api.com, crypto prices, 24h change and sparklines from CoinGecko — refreshed in the browser, with offline fallbacks. |
| **Framed video hero** | Full-bleed greyscale video with film-grain noise, a white outlined frame, a vertical status rail with a live Hong Kong clock, and a scramble-decode headline word. |
| **Scroll progress line** | Neon teal line across the top that fills as you scroll (native CSS scroll timelines, JS fallback). |
| **Product showcase** | Web dashboard and phone mock-ups with live balances, plus a numbered, zig-zag feature grid on line-pattern cards. |
| **Network status** | Corridor-by-corridor rollout table with live mid rates and a USD/HKD Linked Exchange Rate band. |
| **Sign-up flow** | Two-step dialog that carries the visitor's quote into the form. |
| **Accessible & responsive** | Semantic HTML, skip link, reduced-motion support, screen-reader-safe animated text, tuned for phone, tablet, laptop and ultra-wide. |

## Tech

Plain HTML, CSS and vanilla JavaScript — no framework, no build step, no `node_modules`.

- **Type:** Geist & Geist Mono (Google Fonts), Inter fallback
- **Palette:** black-first, `#050505` / `#f1f5f9`, accent teal `#00bfb3`, brand navy `#023e63`
- **Flags:** [circle-flags](https://github.com/HatScripts/circle-flags) via jsDelivr
- **Hosting:** Vercel (static)

## Project structure

```
.
├── index.html            # the whole page
└── assets/
    ├── site.css          # design system + section styles (layered, newest rules last)
    ├── main.js           # rates, converter, sign-up dialog
    ├── ui.js             # reveals, nav spy, clocks, sparklines, scramble text, scroll line
    ├── logo.svg · logo-light.svg · mark.svg
    ├── img/              # CC0 photography (see CREDITS.txt)
    └── video/hero.mp4    # hero background loop
```

## Run locally

Any static server works:

```bash
python3 -m http.server 5317
```

Then open <http://localhost:5317>.

## Customise

- **Hero words** — edit the `data-scramble` list on the hero `<h1>` in `index.html` (separated by `|`). Timings (`HOLD`, `SETTLE`, `FRAME`) live in `assets/ui.js`.
- **Hero video** — replace `assets/video/hero.mp4` (H.264, muted, 10–20 s loop, under ~4 MB). `assets/img/street.jpg` is the poster.
- **Fees, limits & corridors** — constants at the top of `assets/main.js`.

## Before launch

- [ ] Connect the sign-up form to a backend (currently front-end only)
- [ ] Swap in official App Store / Google Play badges and real store links
- [ ] Move rates to a production data source with an SLA
- [ ] Confirm fees, corridor statuses and supported rails with compliance
- [ ] Replace placeholder support email and legal pages
- [ ] Commission or license Hong Kong–specific photography

## Credits

Photography: CC0 images from StockSnap via Openverse — see [`assets/img/CREDITS.txt`](assets/img/CREDITS.txt).
Market data: [ExchangeRate-API](https://www.exchangerate-api.com) and [CoinGecko](https://www.coingecko.com).

---

<div align="center">
<sub>© 2026 Harbour & Hills. All rights reserved. App and dashboard screens are illustrative. Apple and the Apple logo are trademarks of Apple Inc. Google Play is a trademark of Google LLC.</sub>
</div>
