# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single-page academic personal homepage for Chad Schmerling at `chadschmerling.github.io`, with a planned custom-domain cutover to `chadschmerling.com`.

**Architecture:** Plain static HTML + CSS served by GitHub Pages. One `index.html`, one `style.css`, a small `assets/` directory. No build step, no JavaScript, no template engine. Editorial serif aesthetic with UChicago-maroon accent.

**Tech Stack:** HTML5, CSS3 (custom properties), system fonts (Charter / Iowan Old Style / Georgia). Python 3 `http.server` is the local preview server (no install required — ships with macOS). Git + GitHub Pages for deployment.

---

## Conventions used in this plan

- **"Preview"** means: from the repo root, run `python3 -m http.server 8000` and open `http://localhost:8000/` in a browser. Reload after every file change. Stop the server with Ctrl+C.
- There is no test framework — this is a static HTML/CSS site. "Verification" steps are visual (what you should see in the browser) or structural (what the file should contain). Treat them with the same discipline as a passing test: if the visual output is wrong, stop and fix it before moving on.
- Commit messages follow **conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `style:`.
- After every task, you commit. No batched commits across tasks.
- All file paths are relative to the repo root `/Users/chadschmerling/Documents/GitHub/website/`.

---

## File structure produced by this plan

```
/
  index.html                 (Task 2, filled in through Task 11)
  style.css                  (Task 3, grown through Task 11)
  assets/
    favicon.svg              (Task 4)
    headshot-placeholder.svg (Task 6)
    cv.pdf                   (Task 8 — placeholder, real file from user later)
    og-image.svg             (Task 12)
  robots.txt                 (Task 13)
  sitemap.xml                (Task 13)
  README.md                  (Task 14)
  .gitignore                 (already exists)
  docs/                      (already exists — spec + plan live here)
```

No `CNAME` file is created in v1. It is added later during the Phase-2 domain cutover (Task 17).

---

## Task 1: Confirm mailing address with user

**Files:** none (question only)

- [ ] **Step 1: Ask the user to confirm department affiliation**

Post the following in chat and wait for the user's answer:

> "Quick confirm before I write the Contact section: should the mailing address on the site read 'Booth School of Business, 5807 S. Woodlawn Avenue, Chicago, IL 60637' (inferred from your `@chicagobooth.edu` email), or do you want a different department / building? Any specific office number or PhD program label to include?"

- [ ] **Step 2: Record the answer in this plan**

Edit Task 9 ("Add Contact section") and replace the placeholder address block with exactly what the user sent. If the user says "Booth is fine", leave the default block. Do not proceed to Task 2 until this is answered.

- [ ] **Step 3: Commit the plan edit (only if you changed it)**

```bash
git add docs/superpowers/plans/2026-04-20-personal-website.md
git commit -m "docs: record confirmed mailing address in website plan"
```

Skip the commit if the plan was not edited.

---

## Task 2: Scaffold `index.html` with semantic skeleton

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html` with the full semantic skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chad Schmerling</title>
  <meta name="description" content="Chad Schmerling — PhD candidate in economics at the University of Chicago.">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav class="site-nav" aria-label="Primary">
    <!-- nav filled in Task 5 -->
  </nav>

  <main>
    <header class="hero" id="top">
      <!-- hero filled in Task 6 -->
    </header>

    <section id="about" aria-labelledby="about-h">
      <!-- about filled in Task 7 -->
    </section>

    <section id="research" aria-labelledby="research-h">
      <!-- research filled in Task 7 -->
    </section>

    <section id="cv" aria-labelledby="cv-h">
      <!-- cv filled in Task 8 -->
    </section>

    <section id="teaching" aria-labelledby="teaching-h">
      <!-- teaching filled in Task 8 -->
    </section>

    <section id="contact" aria-labelledby="contact-h">
      <!-- contact filled in Task 9 -->
    </section>
  </main>

  <footer class="site-footer">
    <!-- footer filled in Task 10 -->
  </footer>
</body>
</html>
```

- [ ] **Step 2: Preview and verify**

Run: `python3 -m http.server 8000`
Open: `http://localhost:8000/`
Expected: blank white page, browser tab titled "Chad Schmerling". Browser DevTools Network tab shows `style.css` returning 404 (expected — created in Task 3).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: scaffold semantic HTML skeleton for index"
```

---

## Task 3: Create `style.css` with theme tokens and typography

**Files:**
- Create: `style.css`

- [ ] **Step 1: Write the full stylesheet foundation**

```css
/* ---------- Theme tokens ---------- */
:root {
  --ink: #1c1917;
  --paper: #faf8f5;
  --muted: #78716c;
  --maroon: #6b1e1e;
  --rule: #1c1917;
  --nav-border: rgba(28, 25, 23, 0.1);

  --font-serif: Charter, 'Iowan Old Style', Georgia, 'Times New Roman', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  --content-max: 720px;
  --gutter: 24px;
}

/* ---------- Reset (minimal) ---------- */
*, *::before, *::after { box-sizing: border-box; }
body, h1, h2, h3, p, ul, ol, figure { margin: 0; }
ul, ol { padding-left: 1.2em; }
img { max-width: 100%; display: block; }
a { color: var(--maroon); text-decoration: underline; text-underline-offset: 2px; }
a:hover { text-decoration-thickness: 2px; }

/* ---------- Base ---------- */
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.55;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@media (max-width: 720px) {
  body { font-size: 15px; }
}

/* ---------- Layout primitives ---------- */
main {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

section { margin: 56px 0; }
@media (max-width: 720px) { section { margin: 40px 0; } }

/* ---------- Section heading pattern ---------- */
.section-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--maroon);
  border-top: 2px solid var(--rule);
  padding-top: 12px;
  margin-bottom: 16px;
}

/* ---------- Utility classes ---------- */
.muted { color: var(--muted); }
.sans { font-family: var(--font-sans); }

/* ---------- Skip link (accessibility) ---------- */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  position: fixed;
  left: 12px;
  top: 12px;
  width: auto;
  height: auto;
  background: var(--ink);
  color: var(--paper);
  padding: 8px 12px;
  z-index: 1000;
  text-decoration: none;
}
```

- [ ] **Step 2: Add a skip link to `index.html`**

Edit `index.html`. Immediately after the opening `<body>` tag, insert:

```html
<a class="skip-link" href="#top">Skip to content</a>
```

- [ ] **Step 3: Preview and verify**

Reload `http://localhost:8000/`.
Expected: page background is warm off-white (`#faf8f5`), not pure white. Tab-key on first focus reveals the "Skip to content" link at top-left. DevTools confirms `style.css` returns 200.

- [ ] **Step 4: Commit**

```bash
git add style.css index.html
git commit -m "feat: add base stylesheet with theme tokens and typography"
```

---

## Task 4: Create the favicon

**Files:**
- Create: `assets/favicon.svg`
- Modify: `index.html`

- [ ] **Step 1: Create `assets/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#faf8f5"/>
  <text x="16" y="23" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#6b1e1e">CS</text>
</svg>
```

- [ ] **Step 2: Reference the favicon from `index.html`**

Edit `index.html`. Inside `<head>`, immediately after the `<meta name="description">` line, insert:

```html
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
```

- [ ] **Step 3: Preview and verify**

Reload `http://localhost:8000/`.
Expected: browser tab shows a small "CS" monogram in maroon on an off-white background. (In Chrome/Edge/Firefox/Safari current versions SVG favicons are supported.)

- [ ] **Step 4: Commit**

```bash
git add assets/favicon.svg index.html
git commit -m "feat: add monogram SVG favicon"
```

---

## Task 5: Build the sticky top navigation

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Fill in the `<nav class="site-nav">` block in `index.html`**

Replace the `<!-- nav filled in Task 5 -->` comment with:

```html
    <div class="site-nav__inner">
      <a class="site-nav__brand" href="#top">Chad Schmerling</a>
      <ul class="site-nav__links">
        <li><a href="#about">About</a></li>
        <li><a href="#research">Research</a></li>
        <li><a href="#cv">CV</a></li>
        <li><a href="#teaching">Teaching</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
```

- [ ] **Step 2: Append navigation styles to `style.css`**

Append at the end of `style.css`:

```css
/* ---------- Sticky top navigation ---------- */
.site-nav {
  position: sticky;
  top: 0;
  background: var(--paper);
  border-bottom: 1px solid var(--nav-border);
  z-index: 10;
}

.site-nav__inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 14px var(--gutter);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.site-nav__brand {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: -0.3px;
}

.site-nav__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
}

.site-nav__links a {
  color: var(--ink);
  text-decoration: none;
}

.site-nav__links a:hover {
  color: var(--maroon);
}

@media (max-width: 560px) {
  .site-nav__inner { padding: 10px var(--gutter); }
  .site-nav__brand { font-size: 15px; }
  .site-nav__links { gap: 12px; font-size: 12px; }
}

/* Scroll padding so anchor jumps don't hide behind sticky nav */
html { scroll-padding-top: 64px; }
```

- [ ] **Step 3: Preview and verify**

Reload the page.
Expected: a thin sticky bar at the top with "Chad Schmerling" on the left and five links on the right. The bar sticks to the viewport top when you scroll. Clicking a link jumps to the (empty) section below without hiding the target under the nav. On a ~375px-wide browser (use DevTools device toolbar), the links wrap cleanly — nothing overflows.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add sticky top navigation"
```

---

## Task 6: Build the hero section with placeholder headshot

**Files:**
- Create: `assets/headshot-placeholder.svg`
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Create the placeholder headshot SVG**

Create `assets/headshot-placeholder.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="Placeholder headshot">
  <rect width="180" height="180" fill="#e7e5e4"/>
  <circle cx="90" cy="72" r="32" fill="#a8a29e"/>
  <path d="M30,180 C30,130 60,110 90,110 C120,110 150,130 150,180 Z" fill="#a8a29e"/>
  <text x="90" y="170" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" fill="#57534e">placeholder</text>
</svg>
```

- [ ] **Step 2: Fill in the `<header class="hero">` block in `index.html`**

Replace the `<!-- hero filled in Task 6 -->` comment with:

```html
      <div class="hero__photo">
        <img src="assets/headshot-placeholder.svg" alt="Chad Schmerling headshot">
      </div>
      <div class="hero__text">
        <h1 class="hero__name">Chad<br>Schmerling</h1>
        <p class="hero__aff">PhD Candidate &middot; University of Chicago &middot; Economics</p>
        <p class="hero__tag">I study macro-finance, asset pricing, and high-frequency data, with particular interest in FOMC announcements and causal inference in financial markets.</p>
      </div>
```

- [ ] **Step 3: Append hero styles to `style.css`**

Append to `style.css`:

```css
/* ---------- Hero ---------- */
.hero {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 28px;
  align-items: start;
  padding: 56px 0 24px;
}

.hero__photo img {
  width: 180px;
  height: 180px;
  object-fit: cover;
  background: #e7e5e4;
}

.hero__name {
  font-family: var(--font-serif);
  font-size: 48px;
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: -1.2px;
  margin-bottom: 10px;
}

.hero__aff {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
}

.hero__tag {
  font-size: 16px;
  max-width: 52ch;
}

@media (max-width: 720px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 32px 0 16px;
    gap: 20px;
    text-align: left;
  }
  .hero__photo img { width: 120px; height: 120px; }
  .hero__name { font-size: 36px; }
}
```

- [ ] **Step 4: Preview and verify**

Reload the page.
Expected (desktop ≥ 720px): two-column hero. Left column: a 180×180 gray silhouette placeholder with the word "placeholder" printed at the bottom. Right column: "Chad Schmerling" as a two-line bold serif heading, a small uppercase affiliation line underneath in muted gray, and the one-line tagline in body serif. Expected (mobile 375px via DevTools): single column with the 120×120 placeholder above the text.

- [ ] **Step 5: Commit**

```bash
git add assets/headshot-placeholder.svg index.html style.css
git commit -m "feat: add hero section with placeholder headshot"
```

---

## Task 7: Build the About and Research sections

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Fill in the `<section id="about">` block in `index.html`**

Replace the `<!-- about filled in Task 7 -->` comment with:

```html
      <h2 id="about-h" class="section-label">About</h2>
      <p>I am a doctoral candidate in economics at the University of Chicago. My research sits at the intersection of macro-finance, asset pricing, and causal inference, with an empirical focus on high-frequency market data around monetary-policy announcements. Before the PhD, I worked in quantitative research and systematic trading.</p>
      <p class="about__interests"><span class="sans about__interests-label">Research interests</span> &mdash; macro-finance, asset pricing, FOMC announcements, causal inference, high-frequency financial data.</p>
```

- [ ] **Step 2: Fill in the `<section id="research">` block in `index.html`**

Replace the `<!-- research filled in Task 7 -->` comment with:

```html
      <h2 id="research-h" class="section-label">Research</h2>

      <article class="paper">
        <h3 class="paper__title">Historical Meme-Likeness and the Cross-Section of Stock Returns</h3>
        <p class="paper__meta sans">Job Market Paper &middot; 2026</p>
        <p class="paper__abstract">I construct a historically portable, market-data-only measure of meme-like speculative stocks in the U.S. from 1996 to present, combining salience proxies from equity markets with lottery-like characteristics and option-market speculative activity. I document that meme-like episodes existed well before the GameStop era and examine their return predictability in the cross-section.</p>
        <p class="paper__links"><a href="#">[PDF]</a> &nbsp; <a href="#">[SSRN]</a></p>
      </article>
```

- [ ] **Step 3: Append about and research styles to `style.css`**

Append to `style.css`:

```css
/* ---------- About ---------- */
.about__interests { margin-top: 14px; color: var(--muted); font-size: 14px; }
.about__interests-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--maroon);
}

/* ---------- Research ---------- */
.paper { margin-bottom: 28px; }
.paper:last-child { margin-bottom: 0; }

.paper__title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 4px;
}

.paper__meta {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.paper__abstract {
  font-size: 15px;
  margin-bottom: 8px;
}

.paper__links {
  font-family: var(--font-sans);
  font-size: 13px;
}
```

- [ ] **Step 4: Preview and verify**

Reload the page.
Expected: under the hero, an "ABOUT" label in maroon on a thin black top-rule, then a serif paragraph, then a "Research interests" line in muted gray with the label in small maroon caps. Below, a "RESEARCH" label with the same treatment, then a placeholder paper entry — bold serif title, uppercase meta line "JOB MARKET PAPER · 2026", a body-serif abstract, and the `[PDF]` / `[SSRN]` links rendered in sans-serif, maroon, underlined.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css
git commit -m "feat: add about and research sections"
```

---

## Task 8: Build the CV and Teaching sections (with placeholder `cv.pdf`)

**Files:**
- Create: `assets/cv.pdf`
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Create a placeholder `assets/cv.pdf`**

```bash
mkdir -p assets
cat > /tmp/cv-placeholder.ps <<'EOF'
%!PS
/Helvetica 24 selectfont
72 720 moveto
(Chad Schmerling - CV) show
/Helvetica 14 selectfont
72 680 moveto
(Placeholder CV. Final version uploaded later.) show
showpage
EOF
/System/Library/Printers/Libraries/convert -f /tmp/cv-placeholder.ps -o assets/cv.pdf 2>/dev/null \
  || /usr/bin/cupsfilter /tmp/cv-placeholder.ps > assets/cv.pdf 2>/dev/null \
  || (printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<<>>>>endobj\n4 0 obj<</Length 66>>stream\nBT /F1 24 Tf 72 720 Td (Chad Schmerling CV placeholder) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000098 00000 n\n0000000183 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n290\n%%EOF\n' > assets/cv.pdf)
rm -f /tmp/cv-placeholder.ps
```

Run the block. The fallback at the end always works (writes a minimal hand-written PDF) so `assets/cv.pdf` is guaranteed to exist after this step. Open it in Preview to sanity-check — it should open without errors.

- [ ] **Step 2: Fill in the `<section id="cv">` block in `index.html`**

Replace the `<!-- cv filled in Task 8 -->` comment with:

```html
      <h2 id="cv-h" class="section-label">CV</h2>
      <p class="cv-line">
        <a class="cv-link" href="assets/cv.pdf">
          <svg class="cv-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10.59l3.3-3.3 1.4 1.42L12 16.41l-4.7-4.7 1.4-1.42 3.3 3.3V3h2zM5 19h14v2H5v-2z"/></svg>
          Full CV (PDF)
        </a>
        <span class="cv-updated muted">Last updated April 2026</span>
      </p>
```

- [ ] **Step 3: Fill in the `<section id="teaching">` block in `index.html`**

Replace the `<!-- teaching filled in Task 8 -->` comment with:

```html
      <h2 id="teaching-h" class="section-label">Teaching</h2>
      <ul class="teaching-list">
        <li class="course">
          <span class="course__title">Placeholder Course I</span>
          <span class="course__meta sans">Teaching Assistant &middot; Term TBD</span>
        </li>
        <li class="course">
          <span class="course__title">Placeholder Course II</span>
          <span class="course__meta sans">Teaching Assistant &middot; Term TBD</span>
        </li>
        <li class="course">
          <span class="course__title">Placeholder Course III</span>
          <span class="course__meta sans">Teaching Assistant &middot; Term TBD</span>
        </li>
        <li class="course">
          <span class="course__title">Placeholder Course IV</span>
          <span class="course__meta sans">Teaching Assistant &middot; Term TBD</span>
        </li>
        <li class="course">
          <span class="course__title">Placeholder Course V</span>
          <span class="course__meta sans">Teaching Assistant &middot; Term TBD</span>
        </li>
      </ul>
      <p class="muted sans" style="font-size: 11px; margin-top: 10px;">Placeholder entries — the user will replace these with actual courses.</p>
```

- [ ] **Step 4: Append CV and Teaching styles to `style.css`**

Append to `style.css`:

```css
/* ---------- CV ---------- */
.cv-line { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.cv-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 16px;
}
.cv-icon { color: var(--maroon); }
.cv-updated { font-size: 12px; }

/* ---------- Teaching ---------- */
.teaching-list { list-style: none; padding: 0; margin: 0; }
.course {
  padding: 10px 0;
  border-bottom: 1px solid var(--nav-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.course:last-child { border-bottom: 0; }
.course__title { font-weight: 700; font-size: 15px; }
.course__meta {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
}
```

- [ ] **Step 5: Preview and verify**

Reload the page.
Expected: "CV" label, then a maroon down-arrow icon followed by the bold "Full CV (PDF)" link and an "Last updated April 2026" suffix in muted gray. Clicking the link opens/downloads the placeholder PDF. Below that, the "TEACHING" label and five placeholder courses separated by thin gray rules, each with a bold title and an uppercase "TEACHING ASSISTANT · TERM TBD" meta line underneath. Below the list, a small italic-style disclaimer that these are placeholders.

- [ ] **Step 6: Commit**

```bash
git add assets/cv.pdf index.html style.css
git commit -m "feat: add CV and teaching sections with placeholders"
```

---

## Task 9: Build the Contact section

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Fill in the `<section id="contact">` block in `index.html`**

Replace the `<!-- contact filled in Task 9 -->` comment with:

```html
      <h2 id="contact-h" class="section-label">Contact</h2>
      <p class="contact__email">
        <a href="mailto:chad.schmerling@chicagobooth.edu">chad.schmerling@chicagobooth.edu</a>
      </p>
      <address class="contact__address">
        University of Chicago<br>
        Booth School of Business<br>
        5807 S. Woodlawn Avenue<br>
        Chicago, IL 60637
      </address>
```

If Task 1 recorded a different mailing address, use that instead of the Booth block above.

- [ ] **Step 2: Append contact styles to `style.css`**

Append to `style.css`:

```css
/* ---------- Contact ---------- */
.contact__email { font-size: 17px; font-weight: 600; margin-bottom: 14px; }
.contact__address {
  font-style: normal;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
```

- [ ] **Step 3: Preview and verify**

Reload the page.
Expected: "CONTACT" label, then the email as a maroon underlined link (click it — your mail client should open a draft to `chad.schmerling@chicagobooth.edu`), then the four-line mailing address in a smaller muted sans-serif block.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add contact section"
```

---

## Task 10: Build the footer

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Fill in the `<footer class="site-footer">` block in `index.html`**

Replace the `<!-- footer filled in Task 10 -->` comment with:

```html
    <div class="site-footer__inner">
      <span>&copy; 2026 Chad Schmerling</span>
      <span class="muted">Last updated April 2026</span>
    </div>
```

- [ ] **Step 2: Append footer styles to `style.css`**

Append to `style.css`:

```css
/* ---------- Footer ---------- */
.site-footer {
  margin-top: 56px;
  border-top: 1px solid var(--nav-border);
}
.site-footer__inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 20px var(--gutter) 40px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-family: var(--font-sans);
  font-size: 12px;
}
@media (max-width: 560px) {
  .site-footer__inner { flex-direction: column; gap: 4px; }
}
```

- [ ] **Step 3: Preview and verify**

Reload the page. Scroll to the very bottom.
Expected: a thin top border, then a two-column footer row — "© 2026 Chad Schmerling" on the left, "Last updated April 2026" in muted gray on the right, both in sans-serif at 12px. On a narrow viewport, they stack vertically.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add page footer"
```

---

## Task 11: Full-page visual audit at desktop and mobile widths

**Files:** none (review only)

- [ ] **Step 1: Desktop audit at 1280px**

Open `http://localhost:8000/` in a browser window 1280px wide or larger.

Check each item:
- Nav is visible, sticky, and readable.
- Hero photo and text are side-by-side, aligned at the top.
- All five section labels (`ABOUT`, `RESEARCH`, `CV`, `TEACHING`, `CONTACT`) render with a thin black rule above and maroon uppercase text.
- Content never exceeds 720px width.
- Clicking each nav link scrolls to the right section with no offset glitches.
- Footer renders at the bottom with the border.
- Nothing overflows horizontally (no horizontal scrollbar).

If any check fails, fix in the relevant CSS rule (most likely `style.css` section for that component) and re-verify before continuing.

- [ ] **Step 2: Mobile audit at 375px (iPhone SE)**

Open DevTools device toolbar (Chrome: Cmd+Shift+M, Firefox: Cmd+Opt+M) and set viewport to 375×667.

Check each item:
- Nav stays single-row; links wrap cleanly and do not overlap the brand name.
- Hero is single-column: photo (120×120) above text.
- Body font drops to 15px (content reads comfortably).
- Section spacing is 40px between sections (not 56px).
- No horizontal scrolling.
- Footer stacks vertically.

If any check fails, fix and re-verify.

- [ ] **Step 3: Keyboard and accessibility smoke test**

From a fresh page load:
- Press Tab. First focus reveals the "Skip to content" link at top-left.
- Press Tab repeatedly. Focus moves through nav brand → 5 nav links → each in-page link in reading order. Focus indicators are visible (browser-default outline is acceptable for v1).
- All interactive elements are keyboard-reachable.

If focus order is wrong or focus is invisible, fix (usually by removing any `tabindex="-1"` that snuck in, or adding a visible `:focus-visible` style) and re-verify.

- [ ] **Step 4: Browser console check**

Open DevTools Console. Expected: no errors, no warnings, no 404s on the Network tab for any asset loaded by `index.html` (favicon, headshot-placeholder, cv.pdf must all return 200).

If there's a 404, the most common cause is a typo in a file path — fix and re-verify.

- [ ] **Step 5: Commit any fixes from Steps 1–4**

If you made fixes during the audit, commit them now:

```bash
git add -A
git commit -m "fix: resolve issues found during full-page audit"
```

If no fixes were needed, skip the commit.

---

## Task 12: Add Open Graph, Twitter Card, and theme-color meta tags

**Files:**
- Create: `assets/og-image.svg`
- Modify: `index.html`

- [ ] **Step 1: Create `assets/og-image.svg`**

(The spec calls for the headshot as the OG image. While the real headshot is still a placeholder, ship a maroon-on-paper card so shared links look polished. When the user adds a real headshot, they can regenerate this to a 1200×630 JPG.)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f5"/>
  <rect x="0" y="0" width="1200" height="8" fill="#6b1e1e"/>
  <text x="80" y="280" font-family="Georgia, serif" font-size="96" font-weight="700" fill="#1c1917">Chad Schmerling</text>
  <text x="80" y="360" font-family="-apple-system, sans-serif" font-size="28" letter-spacing="4" font-weight="600" fill="#6b1e1e">PHD CANDIDATE &middot; UNIVERSITY OF CHICAGO</text>
  <text x="80" y="420" font-family="Georgia, serif" font-size="32" fill="#57534e">Economics &middot; macro-finance, asset pricing, FOMC</text>
</svg>
```

- [ ] **Step 2: Add meta tags to the `<head>` of `index.html`**

Insert the following block inside `<head>`, immediately after the `<link rel="icon" ...>` line added in Task 4:

```html
  <meta name="theme-color" content="#6b1e1e">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Chad Schmerling">
  <meta property="og:description" content="PhD candidate in economics at the University of Chicago — macro-finance, asset pricing, FOMC.">
  <meta property="og:url" content="https://chadschmerling.github.io/">
  <meta property="og:image" content="https://chadschmerling.github.io/assets/og-image.svg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Chad Schmerling">
  <meta name="twitter:description" content="PhD candidate in economics at the University of Chicago — macro-finance, asset pricing, FOMC.">
  <meta name="twitter:image" content="https://chadschmerling.github.io/assets/og-image.svg">

  <!-- Canonical -->
  <link rel="canonical" href="https://chadschmerling.github.io/">
```

- [ ] **Step 3: Verify meta tags present**

Open `index.html` in the editor and confirm the block above appears inside `<head>`. Reload the page and view source (Cmd+Opt+U in Chrome) — all meta tags should be present in rendered HTML.

- [ ] **Step 4: Commit**

```bash
git add assets/og-image.svg index.html
git commit -m "feat: add OG, Twitter Card, and theme-color meta tags"
```

---

## Task 13: Add `robots.txt` and `sitemap.xml`

**Files:**
- Create: `robots.txt`
- Create: `sitemap.xml`

- [ ] **Step 1: Create `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://chadschmerling.github.io/sitemap.xml
```

- [ ] **Step 2: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://chadschmerling.github.io/</loc>
    <lastmod>2026-04-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Verify the files are reachable from the preview server**

Open `http://localhost:8000/robots.txt` — should show the robots content.
Open `http://localhost:8000/sitemap.xml` — should show the XML (browsers render it as a tree).

- [ ] **Step 4: Commit**

```bash
git add robots.txt sitemap.xml
git commit -m "feat: add robots.txt and sitemap.xml"
```

---

## Task 14: Write `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
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

- **Add a paper:** edit the `<section id="research">` block in `index.html` — copy the existing `<article class="paper">` and fill in title, meta, abstract, links.
- **Add a course:** edit the `<section id="teaching">` block in `index.html` — copy an `<li class="course">` and fill in title and meta.
- **Update CV:** replace `assets/cv.pdf`.
- **Update headshot:** replace `assets/headshot-placeholder.svg` with `assets/headshot.jpg` (any image file) and update the `src` attribute in the hero `<img>` tag inside `index.html`.

## Deploy

This repo deploys via GitHub Pages from the `main` branch at the repo root — no build step.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with local preview and editing instructions"
```

---

## Task 15: Final launch-readiness check

**Files:** none (review only)

- [ ] **Step 1: Verify acceptance criteria from the spec**

Walk through spec §8 and tick each:

1. All seven content sections render (hero, about, research, cv, teaching, contact, footer). ✓ if all present in `index.html`.
2. Desktop (≥1024px) and mobile (375px) both look right. ✓ if Task 11 passed.
3. All links work: PDF opens, SSRN link returns (will 404 until user supplies — acceptable placeholder behavior), `mailto:` opens mail client.
4. No JS errors in the browser console. ✓ if Task 11 Step 4 passed.
5. Semantic HTML: `<main>`, `<nav>`, `<header>`, `<section>`, `<footer>`, proper heading hierarchy (one `<h1>`, multiple `<h2>`, one `<h3>` per paper).
6. Color contrast: `--muted` (`#78716c`) on `--paper` (`#faf8f5`) is approximately 4.5:1. Verify with a contrast checker (Chrome DevTools has one built in, right-click element → Inspect → Accessibility pane).
7. Deploy step lives in Task 16.

If any check fails, fix it in the appropriate file and re-verify before proceeding to Task 16.

- [ ] **Step 2: Verify all git commits are on `main` and tree is clean**

```bash
git status
```

Expected: "nothing to commit, working tree clean".

```bash
git log --oneline -20
```

Expected: all the `feat:`, `docs:`, `fix:` commits from Tasks 2–14.

- [ ] **Step 3: Stop the local preview server**

In the terminal running `python3 -m http.server 8000`, press Ctrl+C.

---

## Task 16: Deploy to `chadschmerling.github.io` (Phase 1)

**Files:** none in this repo (work happens on GitHub and in a new repo)

⚠ **User confirmation required before running this task.** Publishing to `chadschmerling.github.io` makes the site publicly reachable at that URL. Confirm with the user that they want to go live before proceeding.

- [ ] **Step 1: Confirm with user**

Post in chat:
> "Ready to deploy Phase 1 — creating `github.com/chadschmerling/chadschmerling.github.io` and pushing this repo's contents to its `main` branch. After this, the site is publicly live. Proceed?"

Wait for an explicit yes.

- [ ] **Step 2: Create the new GitHub repo**

Run (in the working directory):

```bash
gh repo create chadschmerling/chadschmerling.github.io --public --description "Personal academic homepage"
```

Expected output: a line reporting the created repo URL.

- [ ] **Step 3: Push this repo's contents to the new repo**

Rather than renaming or transferring, push the existing contents to the newly-created empty repo:

```bash
git push git@github.com:chadschmerling/chadschmerling.github.io.git main:main
```

Expected: git pushes all commits successfully.

- [ ] **Step 4: Verify GitHub Pages is enabled on `main` at root**

Run:

```bash
gh api -X POST "repos/chadschmerling/chadschmerling.github.io/pages" \
  -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || gh api "repos/chadschmerling/chadschmerling.github.io/pages"
```

Expected: either Pages is created, or if already enabled, the GET returns the Pages config with `status: "built"` (may be "building" on first call — retry in 30s).

- [ ] **Step 5: Wait for first build and load the site**

Wait ~60 seconds, then open `https://chadschmerling.github.io/` in a browser.

Expected: the site loads, identical to the local preview.

If it returns 404, wait another 60s — first-time builds on a new Pages site can take up to 5 minutes. Check the build status at `https://github.com/chadschmerling/chadschmerling.github.io/actions`.

- [ ] **Step 6: Report the live URL to the user**

Post in chat with the live URL so they can click through and verify.

---

## Task 17: Custom domain cutover to `chadschmerling.com` (Phase 2)

**Files:**
- Create: `CNAME`

⚠ **User confirmation required.** This task depends on the user owning `chadschmerling.com` and being able to change its DNS records. They said during brainstorming that they do own the domain. Confirm with the user that they're ready to cut over before touching DNS.

- [ ] **Step 1: Confirm with user and collect DNS provider name**

Post in chat:
> "Ready for Phase 2 — pointing `chadschmerling.com` at the GitHub Pages site. I'll add a `CNAME` file; you'll need to make DNS changes at your domain registrar. Which provider hosts the DNS for `chadschmerling.com` (Cloudflare, Namecheap, GoDaddy, Google Domains → Squarespace, etc.)? Also confirm you want to proceed now."

Wait for an explicit yes and the provider name. The provider name changes the exact UI instructions in Step 3 but not the DNS values.

- [ ] **Step 2: Add the `CNAME` file**

Create `CNAME` at the repo root containing exactly one line (no trailing whitespace, no extra lines):

```
chadschmerling.com
```

- [ ] **Step 3: Commit and push**

```bash
git add CNAME
git commit -m "feat: add CNAME for chadschmerling.com custom domain"
git push origin main
```

Also push to the deployed repo if working in the original `website` repo:

```bash
git push git@github.com:chadschmerling/chadschmerling.github.io.git main:main
```

- [ ] **Step 4: Provide DNS instructions to the user**

Post in chat:

> At your DNS provider, configure these records for `chadschmerling.com`:
>
> **A records (apex `@`):**
> - `185.199.108.153`
> - `185.199.109.153`
> - `185.199.110.153`
> - `185.199.111.153`
>
> **CNAME record for `www`:**
> - Name: `www`
> - Value: `chadschmerling.github.io.` (with the trailing dot)
>
> Let me know once they're saved — I'll verify propagation and enable HTTPS on GitHub's side.

Wait for the user to confirm DNS changes.

- [ ] **Step 5: Verify DNS propagation**

After the user confirms DNS changes, run:

```bash
dig +short chadschmerling.com
dig +short www.chadschmerling.com
```

Expected: apex `dig` returns the four `185.199.*.153` IPs. `www` `dig` returns `chadschmerling.github.io.` and then the IPs.

If results are empty or wrong, DNS propagation can take minutes to hours. Wait and retry.

- [ ] **Step 6: Set the custom domain in GitHub Pages settings**

Run:

```bash
gh api -X PUT "repos/chadschmerling/chadschmerling.github.io/pages" \
  -f "cname=chadschmerling.com"
```

Expected: success (200). Then open the live site:

```bash
open "https://chadschmerling.com"
```

(The first load may take up to 15 minutes while Let's Encrypt provisions the certificate. If you see a certificate warning, wait.)

- [ ] **Step 7: Enable "Enforce HTTPS"**

After the cert provisions (browser shows the padlock on `https://chadschmerling.com` without warning), run:

```bash
gh api -X PUT "repos/chadschmerling/chadschmerling.github.io/pages" \
  -f "https_enforced=true"
```

Expected: success. Visiting `http://chadschmerling.com` should now redirect to `https://chadschmerling.com`.

- [ ] **Step 8: Update canonical URL and OG URLs to the custom domain**

Now that `chadschmerling.com` is the primary URL, update `index.html`:

- `<link rel="canonical" href="https://chadschmerling.github.io/">` → `https://chadschmerling.com/`
- `<meta property="og:url" content="https://chadschmerling.github.io/">` → `https://chadschmerling.com/`
- `<meta property="og:image" content="https://chadschmerling.github.io/assets/og-image.svg">` → `https://chadschmerling.com/assets/og-image.svg`
- `<meta name="twitter:image" content="https://chadschmerling.github.io/assets/og-image.svg">` → `https://chadschmerling.com/assets/og-image.svg`

Update `robots.txt`:
- `Sitemap: https://chadschmerling.github.io/sitemap.xml` → `https://chadschmerling.com/sitemap.xml`

Update `sitemap.xml`:
- `<loc>https://chadschmerling.github.io/</loc>` → `<loc>https://chadschmerling.com/</loc>`

Update `README.md`:
- Change **Live** URL to `https://chadschmerling.com/` and remove the "Custom domain (planned)" line.

- [ ] **Step 9: Commit and push the URL updates**

```bash
git add index.html robots.txt sitemap.xml README.md
git commit -m "chore: update canonical/OG/sitemap URLs to custom domain"
git push origin main
git push git@github.com:chadschmerling/chadschmerling.github.io.git main:main
```

- [ ] **Step 10: Final verification**

Open `https://chadschmerling.com/` in a fresh browser (or incognito). Confirm:
- HTTPS padlock is present.
- Site renders identically to the Pages URL.
- `view-source:https://chadschmerling.com/` shows the updated canonical URL.
- `https://chadschmerling.com/robots.txt` and `/sitemap.xml` both load.

Report completion to the user.

---

## Plan self-review (performed by plan author)

### Spec coverage

Checked each section of the spec against this plan:

- **§1 Goal** — covered by the end-to-end plan.
- **§2 Non-goals** — nothing in the plan violates the non-goals (no blog, no projects, no dark mode, no JS, no analytics).
- **§3 Architecture + file layout** — Tasks 2, 3, and the task-level File sections match the spec file layout exactly (minus the `headshot.jpg` filename: this plan ships a `headshot-placeholder.svg` since no real JPG is available; spec §7 explicitly allows a placeholder silhouette).
- **§4.1 Sticky nav** — Task 5.
- **§4.2 Hero** — Task 6.
- **§4.3 About** — Task 7.
- **§4.4 Research** — Task 7.
- **§4.5 CV** — Task 8.
- **§4.6 Teaching** — Task 8.
- **§4.7 Contact** — Tasks 1 and 9.
- **§4.8 Footer** — Task 10.
- **§5 Visual spec (typography, tokens, layout, responsive)** — Tasks 3, 5, 6, 7, 8, 9, 10, 11.
- **§6 Deploy Phase 1** — Task 16.
- **§6 Deploy Phase 2 (custom domain)** — Task 17.
- **§7 Placeholders** — placeholders shipped in Tasks 6, 7, 8; README Task 14 explains how the user swaps them.
- **§8 Acceptance criteria** — verified in Tasks 11 and 15.
- **§9 Decisions** — `robots.txt`/`sitemap.xml` in Task 13, favicon in Task 4, OG/Twitter cards in Task 12, mailing address confirmation in Task 1.

No gaps.

### Placeholder scan

No "TBD"/"TODO" in task bodies. Content placeholders that do appear in the code are *intentional* per spec §7 (placeholder bio, placeholder paper, placeholder courses, placeholder CV, placeholder headshot) and are called out as placeholders in the README.

### Type / naming consistency

- CSS class naming is BEM-style (`.site-nav__inner`, `.hero__photo`, `.paper__title`, etc.) and consistent across tasks.
- Section IDs (`about`, `research`, `cv`, `teaching`, `contact`) introduced in Task 2 match exactly in Tasks 5–10 and in the final URLs referenced in Task 16/17.
- Color tokens defined in Task 3 are the only color tokens used downstream.

No inconsistencies.
