# cschmer.github.io

Source for my personal academic homepage.

**Live:** https://cschmer.github.io/
**Custom domain (planned):** https://chadschmerling.com/

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Structure

- `index.html` — single-page site (all content)
- `style.css` — all styles (including the Data section)
- `assets/` — photo, CV, favicon, OG image
- `data/` — Data section: landing page + one explorer per dataset
  - `data/meme-stocks/` — meme-stock lists explorer (static JSON chunks in
    `idx/`, `d/`, `p/`, generated; do not edit by hand)
  - `data/trend-slope-strength/` — Trend Slope and Strength explorer (static
    JSON in `manifest.json`, `summary.json`, `ts.json`, `rolling.json`, `p/`,
    `b/`, generated; do not edit by hand)
- `meme_stocks_website_lists/` — original 24 CSVs + README (served as downloads)
- `trend_slope_strength_data/` — Trend Slope and Strength CSVs + README (served
  as downloads; regenerated upstream by the LinSlope research repo's
  `gen_website_data.py` and `gen_website_index_benchmarks.py`, never edited here)
- `scripts/build_meme_stock_data.py` — regenerates `data/meme-stocks/` JSON
  from the CSVs (`python3 scripts/build_meme_stock_data.py`)
- `scripts/build_ts_data.py` — regenerates `data/trend-slope-strength/` JSON
  from the CSVs (`python3 scripts/build_ts_data.py`); also checks the README's
  headline numbers against `summary_stats.csv` and the daily spread identity
- `robots.txt`, `sitemap.xml` — SEO basics

## Editing content

- **Add a paper:** edit the `<section id="research">` block in `index.html` — replace the "Working papers in progress" line with `<article class="paper">` entries.
- **Add a course:** edit the `<section id="teaching">` block in `index.html` — copy an `<li class="course">` and fill in title and meta.
- **Update CV:** replace `assets/cv.pdf`.
- **Add a dataset:** create `data/<slug>/` with `index.html`, `app.js`, and
  `methodology.html` following the two existing explorers (same nav, footer,
  and `style.css` classes; no build step, no CDN dependencies), add an
  `<article class="paper">` card on `data/index.html`, and add both pages to
  `sitemap.xml`. Put the source CSVs at the repo root and generate the
  explorer's JSON with a script in `scripts/`.
- **Refresh a dataset:** drop the regenerated CSVs into the source folder and
  rerun the matching build script; bump the `?v=` query on the `app.js` tag
  in that explorer's `index.html` if `app.js` changed.
- **Update headshot:** replace `assets/headshot-placeholder.svg` with `assets/headshot.jpg` (any image file) and update the `src` attribute in the hero `<img>` tag inside `index.html`.

## Deploy

This repo deploys via GitHub Pages from the `main` branch at the repo root — no build step.
