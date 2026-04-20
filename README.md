# chadschmerling.github.io

Source for my personal academic homepage.

**Live:** https://chadschmerling.github.io/
**Custom domain (planned):** https://chadschmerling.com/

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Structure

- `index.html` — single-page site (all content)
- `style.css` — all styles
- `assets/` — photo, CV, favicon, OG image
- `robots.txt`, `sitemap.xml` — SEO basics

## Editing content

- **Add a paper:** edit the `<section id="research">` block in `index.html` — replace the "Working papers in progress" line with `<article class="paper">` entries.
- **Add a course:** edit the `<section id="teaching">` block in `index.html` — copy an `<li class="course">` and fill in title and meta.
- **Update CV:** replace `assets/cv.pdf`.
- **Update headshot:** replace `assets/headshot-placeholder.svg` with `assets/headshot.jpg` (any image file) and update the `src` attribute in the hero `<img>` tag inside `index.html`.

## Deploy

This repo deploys via GitHub Pages from the `main` branch at the repo root — no build step.
