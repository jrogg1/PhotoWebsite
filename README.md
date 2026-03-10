# JamesRoggPhoto Portfolio Website

A responsive, tab-driven photography portfolio inspired by a minimalist, image-first style.

## What is included

- Desktop sidebar + mobile horizontal tab navigation
- Tabs: `portraits`, `places`, `animals`, `about`, `contact`
- Photo panels with masonry-style layout
- About and Contact content panels
- Real image folders wired into tabs (`portraits`, `places`, `animals`)

## Project structure

```text
JamesRoggPhoto/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   └── main.js
    └── images/
        └── portfolio/
            ├── portraits/
            ├── places/
            └── animals/
```

## Run locally

From the project root:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## Customize content

### 1) Update brand and links

Edit `/index.html`:

- Name/brand text
- Intro line
- Email links
- Instagram link
- About and Contact copy

### 2) Replace or add images

Current live images are in:

- `/assets/images/portfolio/portraits/`
- `/assets/images/portfolio/places/`
- `/assets/images/portfolio/animals/`

Gallery assignments are controlled in `/assets/js/main.js` under `photoSets`.

Each item has:

- `src`
- `alt`
- `title`
- `meta`
- `size` (`wide` or `tall`)

### 3) Edit tabs

Tabs are defined in `/index.html` via `data-tab`.

- `portraits`
- `places`
- `animals`
- `about`
- `contact`

If you rename a tab, use the same key in:

- tab button (`data-tab`)
- panel (`data-panel`)
- grid (`data-grid`) for image tabs
- `photoSets` key in `/assets/js/main.js`

## Responsive behavior

- Desktop: left sidebar navigation + right content panel
- Tablet/mobile: tabs switch to horizontal scrollable top nav
- Image columns collapse from 3 -> 2 -> 1 for small screens

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings > Pages**, choose:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
3. Save and wait for deploy.

Live URL format:

`https://<your-github-username>.github.io/<repo-name>/`
