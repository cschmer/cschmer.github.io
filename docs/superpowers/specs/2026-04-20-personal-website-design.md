# Personal Website Design — chadschmerling.github.io

**Date:** 2026-04-20
**Owner:** Chad Schmerling
**Status:** Approved for implementation planning

## 1. Goal

Build a minimal academic personal homepage for Chad Schmerling (PhD candidate, University of Chicago, Economics). The site is a single public-facing page hosted on GitHub Pages at `https://chadschmerling.github.io/`, with plans to cut over to the custom domain `chadschmerling.com` once the site is live.

The site's job is to be a credible, fast, low-maintenance academic homepage — the kind a faculty recruiter or fellow researcher would land on from a paper footnote or email signature.

## 2. Non-goals

The following are explicitly out of scope for this spec. They can be added later as separate projects.

- Blog or notes section
- Code / projects showcase (autofin, theo-engine, etc.)
- Dark mode
- Client-side JavaScript (search, filtering, dynamic content)
- Analytics (Plausible, GoatCounter, GA)
- Text that relies on social-media or mention data

## 3. Architecture

Plain static HTML + CSS. No build step, no static site generator, no JavaScript runtime. GitHub Pages serves the repository contents directly.

Rationale: for 5–7 papers and 5–7 courses (steady state), a single HTML file is faster to edit than any generator would be to configure. Migrating to Jekyll or Hugo later is straightforward if the site outgrows a single file.

### File layout

```
/
  index.html          single page with all sections
  style.css           all styles (maroon accent, editorial serif)
  assets/
    headshot.jpg      hero photo (provided separately by user)
    cv.pdf            CV (provided separately by user)
    favicon.svg       favicon (monogram "CS" in maroon)
  CNAME               single line: chadschmerling.com (added when domain is cut over)
  .gitignore
  README.md           one-line description pointing at the live URL
```

There are no other files required for v1. `index.html` and `style.css` are the only authored files.

## 4. Content sections (single-page scroll)

The page is one document. A sticky top navigation bar links to each section by in-page anchor.

### 4.1 Sticky top navigation
- Left: wordmark "Chad Schmerling" (anchors to top)
- Right: `About · Research · CV · Teaching · Contact`
- Stays visible on scroll, collapses to a single row with smaller type on mobile
- Background matches page background with a subtle bottom border on scroll

### 4.2 Hero
- Left: square headshot (`assets/headshot.jpg`), ~180px on desktop
- Right: name, affiliation line "PhD Candidate · University of Chicago · Economics", 1–2 sentence tagline
- On mobile: photo stacks above text
- Placeholder used until user provides `headshot.jpg`

### 4.3 About
- ~100-word bio paragraph
- Research interests as a short labeled list ("Research interests: macro-finance, asset pricing, FOMC announcements, causal inference, high-frequency data")
- Placeholder bio text until user provides final copy

### 4.4 Research
- One entry per paper. Ordered newest first.
- Per entry:
  - Title (bold)
  - Coauthors line (if any)
  - Abstract (always visible, ~1 paragraph)
  - Status + metadata ("Working paper, 2026" or similar)
  - Links: `[PDF]`, `[SSRN]` where applicable (placeholder links until user provides)
- v1 will include one entry placeholder for the job market paper; additional entries are added by editing `index.html` directly.

### 4.5 CV
- One line: "Full CV (PDF)" as a link to `assets/cv.pdf`
- Download icon (inline SVG, maroon)
- Short caption line: "Last updated {date}"

### 4.6 Teaching
- One entry per course.
- Per entry: course title + number (e.g., "Price Theory (Econ 301)"), term (e.g., "Spring 2025"), role (e.g., "Teaching Assistant"), optional syllabus link.
- Placeholder entries until user provides the five-to-seven actual courses.

### 4.7 Contact
- Email: `chad.schmerling@chicagobooth.edu` rendered as a `mailto:` link
- Mailing address block (default — Booth, inferred from the `@chicagobooth.edu` email; user will confirm or amend during implementation):
  ```
  University of Chicago
  Booth School of Business
  5807 S. Woodlawn Avenue
  Chicago, IL 60637
  ```

### 4.8 Footer
- Single line, small muted text
- Content: `© 2026 Chad Schmerling · Last updated YYYY-MM-DD`
- No social icons in v1 (per scope decision to include email only)

## 5. Visual specification

**Inspiration / aesthetic:** Editorial serif. More typographic personality than a plain faculty page, but still unambiguously academic.

### Typography
- **Body + display:** `Charter, 'Iowan Old Style', Georgia, 'Times New Roman', serif`
  - Charter ships on macOS and iOS; Iowan Old Style is also macOS. Georgia is the universal fallback for Windows/Android/Linux.
  - No webfont loading — system fonts only, for performance and minimalism.
- **Section labels & affiliation uppercase text:** `-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- Base size: 16px on desktop, 15px on mobile; line-height 1.55.

### Color palette
| Token            | Value     | Use                                                 |
|------------------|-----------|-----------------------------------------------------|
| `--ink`          | `#1c1917` | Primary text                                        |
| `--paper`        | `#faf8f5` | Page background (warm off-white)                    |
| `--muted`        | `#78716c` | Secondary text (dates, metadata, captions)          |
| `--maroon`       | `#6b1e1e` | Accent: links, section-heading labels, thin rules   |
| `--rule`         | `#1c1917` | 2px top-rule above each section heading             |
| `--nav-border`   | `rgba(28,25,23,0.1)` | Subtle nav bottom border on scroll       |

### Layout
- Max content width: 720px, centered, with 24px horizontal padding on mobile.
- Section-heading pattern: small uppercase sans-serif label in maroon, with a 2px solid black rule above (matches the Editorial mockup that was approved).
- Generous vertical spacing between sections (48–64px).
- Single-column throughout; no sidebars.

### Responsive behavior
- Desktop (>= 720px wide): two-column hero (photo left, text right)
- Mobile (< 720px): single column, hero photo centered above text, nav collapses to condensed single row

## 6. Deploy and domain

### Phase 1 — GitHub Pages user site
1. Current repo is `github.com/chadschmerling/website`. This will not serve at the user URL; GitHub Pages user sites require the repo name to match the username exactly.
2. Build and iterate in this `website` repo until the site is ready.
3. When ready to launch:
   - Create a new empty public GitHub repo named `chadschmerling.github.io`.
   - Push the contents of `website` to the new repo's `main` branch.
   - In repo settings, ensure Pages is enabled and set to deploy from `main` / root.
   - Site is live at `https://chadschmerling.github.io/` within a few minutes.
4. The `website` repo can be kept as a development fork, archived, or deleted depending on preference.

### Phase 2 — Custom domain `chadschmerling.com`
1. Add a file named `CNAME` at the repo root containing exactly one line: `chadschmerling.com`
2. At the domain's DNS provider, create:
   - **A records** for the apex (`@`) pointing to GitHub Pages' four IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **CNAME record** for `www` → `chadschmerling.github.io.`
3. In the GitHub Pages settings, enter `chadschmerling.com` as the custom domain and enable "Enforce HTTPS" once the Let's Encrypt cert has provisioned (usually < 24h).

Phase 2 is independent of site content and can be executed at any time after Phase 1 is live.

## 7. Placeholders and user-provided assets

The implementation will ship with placeholders for content the user will provide later:

| Placeholder                         | Final source                                |
|-------------------------------------|---------------------------------------------|
| `assets/headshot.jpg` (silhouette)  | User sends professional headshot             |
| `assets/cv.pdf` (empty PDF or omit) | User uploads final CV                        |
| Bio paragraph (generic)             | User provides 100-word bio                   |
| Research entry (JMP placeholder)    | User provides paper title, coauthors, abstract, PDF/SSRN links |
| Teaching entries (placeholder × 5)  | User provides course titles, terms, roles   |
| Mailing address exact department    | User confirms Booth vs Economics department |

Placeholders should be obviously-placeholder (e.g., "Lorem ipsum" bio, gray silhouette photo) so they are not mistaken for final content if the site is viewed before real content is added.

## 8. Acceptance criteria

The site is considered ready to launch when:

1. `index.html` renders all seven content sections listed in §4 with either final or clearly-marked placeholder content.
2. The page passes a visual check at both desktop (>=1024px) and mobile (375px) widths — nothing overflows, nav is usable, photo scales appropriately.
3. All links (PDF, SSRN, mailto) work; no broken local asset references.
4. Page loads with no JavaScript errors (browser console clean — there is no JS, so this is trivially satisfied if assets load).
5. The site is accessible: semantic HTML (`<main>`, `<nav>`, `<section>`, `<h1>`/`<h2>`/`<h3>` hierarchy), alt text on the headshot, sufficient color contrast for `--muted` on `--paper` (check against WCAG AA).
6. Deployed to `chadschmerling.github.io` and publicly reachable.

## 9. Decisions carried into the implementation plan

The following small decisions are made here so the implementation plan does not have to relitigate them:

- **Include `robots.txt` and `sitemap.xml`** — low effort, marginal SEO benefit; both shipped in v1.
- **Favicon** — monogram "CS" SVG in maroon on the `--paper` background. No raster fallback needed; SVG favicons are supported in all modern browsers.
- **Open Graph and Twitter Card meta tags** — included in `<head>` for v1. Use the headshot as the preview image.
- **Mailing address default** — Booth (see §4.7). Implementer asks user to confirm before merging.
