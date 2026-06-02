# Astro Migration Design
**Date:** 2026-06-02  
**Status:** Approved

## Overview

Migrate fallenworld.nexus from Next.js to Astro. The site is now a static community showcase with no auth, no database, and no server-side logic. Astro outputs pure static HTML, deploys to GitHub Pages for free, and has no persistent server process to exploit.

## Goals

- Replace Next.js entirely with Astro
- Same visual design (dark theme, emerald green accents, Tailwind CSS)
- Host on GitHub Pages (free, zero VPS needed for the website)
- Keep all markdown docs (gameplay guides, FAQ, PrismaUI docs) rendering on-site
- Zero dynamic server routes — everything pre-built at deploy time

## Pages

| Route | Source | Notes |
|-------|--------|-------|
| `/` | `src/pages/index.astro` | Home page |
| `/apply` | `src/pages/apply.astro` | Links to external Fillout forms |
| `/community` | `src/pages/community.astro` | Discord invite link |
| `/wiki` | `src/pages/wiki.astro` | Redirect to external wiki (URL TBD) |
| `/roadmap` | `src/pages/roadmap.astro` | Redirect to Trello (URL TBD) |
| `/prismaui-f4` | `src/pages/prismaui-f4/index.astro` | PrismaUI F4 showcase |
| `/prismaui-f4/[section]` | `src/pages/prismaui-f4/[section].astro` | PrismaUI docs sections |
| `/[...slug]` | `src/pages/[...slug].astro` | Markdown content (gameplay, FAQ, etc.) |

## Project Structure

```
websitedev-next/           ← repo root (rename later if desired)
├── astro.config.mjs       ← Astro config with GitHub Pages base URL
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml     ← GitHub Actions: build + deploy to gh-pages
├── public/                ← static assets (images, video) — unchanged
├── src/
│   ├── layouts/
│   │   └── Layout.astro   ← shared HTML shell, header, fonts
│   ├── components/
│   │   └── Header.astro   ← nav + Discord button
│   ├── pages/
│   │   ├── index.astro
│   │   ├── apply.astro
│   │   ├── community.astro
│   │   ├── wiki.astro
│   │   ├── roadmap.astro
│   │   ├── prismaui-f4/
│   │   │   ├── index.astro
│   │   │   └── [section].astro
│   │   └── [...slug].astro
│   ├── content/
│   │   ├── config.ts      ← Astro content collection schemas
│   │   ├── docs/          ← moved from docs/main/ (gameplay, FAQ, etc.)
│   │   └── prismaui/      ← moved from src/content/prismaui/
│   └── styles/
│       └── global.css     ← Tailwind base + any custom CSS
└── docs/                  ← superpowers specs/plans only
```

## Styling

- **Tailwind CSS** via `@astrojs/tailwind` integration
- Same color tokens: `bg-[#0a0a0a]`, `text-emerald-500`, `border-white/10` etc.
- Existing class names copy directly from Next.js components into Astro
- SCSS dropped — plain CSS only (the site uses minimal custom CSS beyond Tailwind)

## Content Collections

Two collections defined in `src/content/config.ts`:

**`docs`** — gameplay guides, FAQ, installation, etc.
- Source: `docs/main/**/*.md` → moved to `src/content/docs/`
- Frontmatter: `title`, optional `description`, optional `order`
- Route: `/[...slug]` renders each file as a static page

**`prismaui`** — PrismaUI F4 framework documentation
- Source: `src/content/prismaui/**/*.md` — stays in place
- Frontmatter: `title`, optional `description`
- Route: `/prismaui-f4/[section]` renders each file

## GitHub Pages Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Trigger: push to `main`
2. Run `npm run build`
3. Deploy `dist/` to `gh-pages` branch using `actions/deploy-pages`

DNS: point `fallenworld.nexus` CNAME at `nomadsreach.github.io` via Cloudflare (proxied for DDoS protection).

`astro.config.mjs` sets `site: 'https://fallenworld.nexus'` and `base: '/'`.

## What Is Removed vs Next.js

- No `next/link`, `next/image`, `next/navigation` — plain `<a>` tags and `<img>` tags
- No server components, no API routes, no middleware
- No `node_modules` with 400+ packages — Astro install is ~50 packages
- No persistent Node process on the server
- No VPS needed for the website

## Out of Scope

- Wiki content (goes to external Wiki.gg — URL to be added when ready)
- Roadmap content (goes to Trello — URL to be added when ready)
- Discord bot (stays on Hetzner VPS, separate repo)
