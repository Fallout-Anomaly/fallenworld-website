# Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stripped Next.js project with a fully functional Astro static site, deploying to GitHub Pages at fallenworld.nexus.

**Architecture:** Astro with `@astrojs/mdx` and `@astrojs/tailwind`. Two content collections (`docs` and `prismaui`) render markdown via `[...slug].astro` and `/prismaui-f4/[section].astro`. Existing Docusaurus MDX syntax (TerminalCard, LinkCard, `:::admonitions`) is handled by renaming `.md` → `.mdx`, removing per-file imports, passing Astro components globally at render time, and adding `remark-directive` for admonition syntax. GitHub Actions deploys `dist/` to `gh-pages` on push to `main`.

**Tech Stack:** Astro 4.x, `@astrojs/mdx`, `@astrojs/tailwind`, Tailwind CSS 3.x, `remark-directive`, TypeScript, GitHub Actions `actions/deploy-pages`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Create | Astro deps only |
| `astro.config.mjs` | Create | Astro + integrations + remark-directive |
| `tailwind.config.mjs` | Create | Tailwind with custom tokens |
| `tsconfig.json` | Create | Astro TypeScript config |
| `.gitignore` | Update | Replace Next.js entries with Astro entries |
| `src/styles/global.css` | Create | Tailwind base + CSS variables from index.module.css |
| `src/layouts/Layout.astro` | Create | HTML shell, head, fonts |
| `src/components/Header.astro` | Create | Nav bar + Discord button |
| `src/components/TerminalCard.astro` | Create | Replaces Docusaurus TerminalCard in MDX |
| `src/components/LinkCard.astro` | Create | Replaces Docusaurus LinkCard in MDX |
| `src/content/config.ts` | Create | Content collection schemas |
| `src/content/docs/**` | Create (move+rename) | Docs from `docs/main/`, .md → .mdx, strip imports |
| `src/content/prismaui/**` | Modify | Strip per-file imports (already in place) |
| `src/data/nav.ts` | Create | Sidebar nav structure (replaces sidebars.js) |
| `src/pages/index.astro` | Create | Home page: hero + gallery |
| `src/pages/apply.astro` | Create | Application page |
| `src/pages/community.astro` | Create | Community / Discord page |
| `src/pages/wiki.astro` | Create | Redirect to external wiki |
| `src/pages/roadmap.astro` | Create | Redirect to Trello |
| `src/pages/prismaui-f4/index.astro` | Create | PrismaUI showcase landing |
| `src/pages/prismaui-f4/[section].astro` | Create | Individual PrismaUI doc pages |
| `src/pages/[...slug].astro` | Create | All docs/ collection pages |
| `.github/workflows/deploy.yml` | Create | GitHub Actions deploy to gh-pages |
| `public/` | Partial cleanup | Delete Next.js SVG placeholders |
| `src/styles/index.module.css` | Delete | Merged into global.css |
| `src/data/sidebars.js` | Delete | Replaced by nav.ts |

---

## Task 1: Bootstrap — package.json and config files

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tailwind.config.mjs`
- Create: `tsconfig.json`
- Update: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "fallenworld-website",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/mdx": "^3.1.0",
    "@astrojs/tailwind": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "remark-directive": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\package.json`.

- [ ] **Step 2: Install dependencies**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create astro.config.mjs**

This config wires MDX, Tailwind, and `remark-directive`. The directive plugin enables `:::warning`, `:::tip`, `:::info`, `:::danger`, `:::important` admonition syntax from the existing Docusaurus markdown files.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import remarkDirective from 'remark-directive';

function remarkAdmonitions() {
  return (tree) => {
    const { visit } = require('unist-util-visit');
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' &&
        ['warning', 'tip', 'info', 'danger', 'important'].includes(node.name)
      ) {
        const label = node.children.find((c) => c.type === 'directiveLabel');
        const labelText = label ? label.children.map((c) => c.value || '').join('') : node.name;
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = { class: `admonition admonition-${node.name}` };
        if (label) {
          label.data = label.data || {};
          label.data.hName = 'div';
          label.data.hProperties = { class: 'admonition-heading' };
        }
      }
    });
  };
}

export default defineConfig({
  site: 'https://fallenworld.nexus',
  base: '/',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    remarkPlugins: [remarkDirective, remarkAdmonitions],
  },
});
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\astro.config.mjs`.

**Note:** The `remarkAdmonitions` function uses a dynamic `require` — this needs to be converted to a proper ES import. See Step 3b.

- [ ] **Step 3b: Fix the remark plugin import**

The `unist-util-visit` is included transitively by remark. Install it explicitly and update the config:

```powershell
npm install unist-util-visit
```

Then update `astro.config.mjs` to use a top-level import:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

function remarkAdmonitions() {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' &&
        ['warning', 'tip', 'info', 'danger', 'important'].includes(node.name)
      ) {
        const label = node.children.find((c) => c.type === 'directiveLabel');
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = { class: `admonition admonition-${node.name}` };
        if (label) {
          label.data = label.data || {};
          label.data.hName = 'div';
          label.data.hProperties = { class: 'admonition-heading' };
        }
      }
    });
  };
}

export default defineConfig({
  site: 'https://fallenworld.nexus',
  base: '/',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    remarkPlugins: [remarkDirective, remarkAdmonitions],
  },
});
```

- [ ] **Step 4: Create tailwind.config.mjs**

```js
// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\tailwind.config.mjs`.

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\tsconfig.json`.

- [ ] **Step 6: Update .gitignore**

Replace the file at `D:\Projects\AnomalyWebsite\websitedev-next\.gitignore` with:

```
# dependencies
/node_modules

# build output
/dist

# Astro cache
.astro/

# env files
.env
.env.local
.env.*

# OS
.DS_Store

# editor
.cursor/
.vscode/

# local-only / do-not-commit
AGENTS.md
CLAUDE.md
README.md
*.bat
issues.md
task.md
```

- [ ] **Step 7: Verify Astro can start**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
npm run dev
```

Expected: `astro dev` starts on `http://localhost:4321`. It will show a blank or 404 page — that's fine, no pages exist yet. Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
git add package.json astro.config.mjs tailwind.config.mjs tsconfig.json .gitignore
git commit -m "chore: bootstrap Astro project"
```

---

## Task 2: Global styles and Layout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/Layout.astro`

- [ ] **Step 1: Create global.css**

This merges Tailwind base with the CSS variables and custom classes from `src/styles/index.module.css`. The module CSS uses camelCase class names — they are converted to kebab-case global classes here.

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --card-bg: #111;
  --card-border: #374151;
  --card-header-bg: #141414;
  --card-accent: #0d9488;
  --text: #f5f5f5;
  --text-muted: #9ca3af;
  --highlight: #0d9488;
  --highlight-hover: #2dd4bf;
  --glow: rgba(13, 148, 136, 0.12);
}

html {
  background-color: #0a0a0a;
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
}

body {
  min-height: 100vh;
  background-color: #0a0a0a;
  margin: 0;
  padding: 0;
}

/* ---------- Admonitions (converted from Docusaurus :::type syntax) ---------- */
.admonition {
  border-left: 4px solid var(--card-accent);
  background: var(--card-bg);
  border-radius: 4px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
}

.admonition-heading {
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.admonition-warning { border-color: #f59e0b; }
.admonition-warning .admonition-heading { color: #f59e0b; }

.admonition-tip { border-color: #10b981; }
.admonition-tip .admonition-heading { color: #10b981; }

.admonition-info { border-color: #3b82f6; }
.admonition-info .admonition-heading { color: #3b82f6; }

.admonition-danger { border-color: #ef4444; }
.admonition-danger .admonition-heading { color: #ef4444; }

.admonition-important { border-color: #8b5cf6; }
.admonition-important .admonition-heading { color: #8b5cf6; }

/* ---------- Prose / doc content ---------- */
.prose-doc {
  max-width: 72ch;
  color: var(--text);
  line-height: 1.7;
}

.prose-doc h1, .prose-doc h2, .prose-doc h3 {
  color: var(--text);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.prose-doc h1 { font-size: 2rem; font-weight: 800; }
.prose-doc h2 { font-size: 1.4rem; font-weight: 700; border-bottom: 1px solid var(--card-border); padding-bottom: 0.25rem; }
.prose-doc h3 { font-size: 1.15rem; font-weight: 600; }

.prose-doc a { color: var(--highlight); text-decoration: underline; }
.prose-doc a:hover { color: var(--highlight-hover); }

.prose-doc ul, .prose-doc ol { padding-left: 1.5rem; margin: 1rem 0; }
.prose-doc li { margin-bottom: 0.35rem; }

.prose-doc code {
  background: #1a1a1a;
  border: 1px solid var(--card-border);
  border-radius: 3px;
  padding: 0.1em 0.35em;
  font-size: 0.875em;
  color: #e2e8f0;
}

.prose-doc pre {
  background: #111;
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.prose-doc pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.85rem;
}

.prose-doc img {
  max-width: 100%;
  border-radius: 6px;
  margin: 1rem 0;
}

.prose-doc hr {
  border-color: var(--card-border);
  margin: 2rem 0;
}

.prose-doc blockquote {
  border-left: 3px solid var(--card-accent);
  padding-left: 1rem;
  color: var(--text-muted);
  margin: 1rem 0;
}

.prose-doc table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
}

.prose-doc th, .prose-doc td {
  border: 1px solid var(--card-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.prose-doc th {
  background: var(--card-header-bg);
  font-weight: 600;
}

/* ---------- Hero video (home page) ---------- */
.hero-video-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  will-change: transform;
}

.hero-video-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.75) 60%, rgba(10,10,10,0.9) 100%);
}

.hero-video-iframe {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 177.78vh;
  height: 100vh;
  min-width: 100%;
  min-height: 56.25vw;
  transform: translate(-50%, -50%);
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\styles\global.css`.

- [ ] **Step 2: Create Layout.astro**

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';
import Header from '../components/Header.astro';

interface Props {
  title?: string;
  description?: string;
}

const {
  title = 'Fallen World',
  description = 'The #1 hardcore survival modlist for Fallout 4',
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/img/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>{title === 'Fallen World' ? 'Fallen World' : `${title} — Fallen World`}</title>
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
  </body>
</html>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\layouts\Layout.astro`.

- [ ] **Step 3: Commit**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
git add src/styles/global.css src/layouts/Layout.astro
git commit -m "feat: global styles and Layout shell"
```

---

## Task 3: Header and MDX components

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/TerminalCard.astro`
- Create: `src/components/LinkCard.astro`

- [ ] **Step 1: Create Header.astro**

```astro
---
// src/components/Header.astro
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/docs/intro', label: 'Guide' },
  { href: '/apply', label: 'Apply' },
  { href: '/community', label: 'Community' },
  { href: '/prismaui-f4', label: 'PrismaUI' },
];

const currentPath = Astro.url.pathname;
---

<header class="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
  <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
    <a href="/" class="text-lg font-bold tracking-widest text-white uppercase hover:text-emerald-500 transition-colors">
      Fallen World
    </a>
    <ul class="flex items-center gap-6 text-sm font-medium">
      {navLinks.map(({ href, label }) => (
        <li>
          <a
            href={href}
            class={`transition-colors hover:text-emerald-400 ${
              currentPath === href || currentPath.startsWith(href + '/')
                ? 'text-emerald-400'
                : 'text-gray-300'
            }`}
          >
            {label}
          </a>
        </li>
      ))}
      <li>
        <a
          href="https://discord.gg/fallenworld"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-md bg-[#5865F2] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#4752c4] transition-colors"
        >
          Discord
        </a>
      </li>
    </ul>
  </nav>
</header>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\components\Header.astro`.

**Note:** The Discord invite URL `https://discord.gg/fallenworld` is a placeholder — update with the real invite link before going live.

- [ ] **Step 2: Create TerminalCard.astro**

This replaces the Docusaurus `TerminalCard` component used in the MDX docs. It wraps content in a dark bordered card with a terminal-style header.

```astro
---
// src/components/TerminalCard.astro
interface Props {
  title?: string;
}
const { title } = Astro.props;
---

<div class="terminal-card" style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; margin: 1.5rem 0; overflow: hidden;">
  {title && (
    <div style="background: var(--card-header-bg); border-bottom: 1px solid var(--card-border); padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span style="display: flex; gap: 5px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56;"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e;"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f;"></span>
      </span>
      <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">{title}</span>
    </div>
  )}
  <div style="padding: 1.25rem 1.5rem;" class="prose-doc">
    <slot />
  </div>
</div>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\components\TerminalCard.astro`.

- [ ] **Step 3: Create LinkCard.astro**

This replaces the Docusaurus `LinkCard` component used in the MDX docs. It renders a clickable card linking to an external URL.

```astro
---
// src/components/LinkCard.astro
interface Props {
  title: string;
  meta?: string;
  href: string;
}
const { title, meta, href } = Astro.props;
---

<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  style="display: block; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; text-decoration: none; transition: border-color 0.2s;"
  onmouseover="this.style.borderColor='var(--card-accent)'"
  onmouseout="this.style.borderColor='var(--card-border)'"
>
  <div style="font-weight: 700; color: var(--text); margin-bottom: 0.25rem;">{title}</div>
  {meta && <div style="font-size: 0.875rem; color: var(--text-muted);">{meta}</div>}
  <div style="font-size: 0.8rem; color: var(--highlight); margin-top: 0.5rem;">↗ {href}</div>
</a>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\components\LinkCard.astro`.

- [ ] **Step 4: Commit**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
git add src/components/Header.astro src/components/TerminalCard.astro src/components/LinkCard.astro
git commit -m "feat: Header, TerminalCard, and LinkCard components"
```

---

## Task 4: Content collections config + migrate docs to MDX

**Files:**
- Create: `src/content/config.ts`
- Create: `src/data/nav.ts`
- Move+rename: `docs/main/**/*.md` → `src/content/docs/**/*.mdx`
- Modify: `src/content/prismaui/**/*.md` — strip per-file imports

The docs use Docusaurus-style MDX imports (`import TerminalCard from '@site/...'`). These must be removed from every file — components will be passed globally at render time instead.

- [ ] **Step 1: Create src/content/config.ts**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    sidebar_label: z.string().optional(),
    sidebar_position: z.number().optional(),
    hide_title: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const prismaui = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { docs, prismaui };
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\content\config.ts`.

- [ ] **Step 2: Create src/data/nav.ts**

This replicates the sidebar structure from `src/data/sidebars.js` as a typed TypeScript constant.

```ts
// src/data/nav.ts
export interface NavItem {
  label: string;
  slug: string;
}

export interface NavGroup {
  label: string;
  collapsed?: boolean;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

export const docsNav: NavEntry[] = [
  { label: 'Introduction', slug: 'intro' },
  { label: 'Requirements', slug: 'requirements' },
  { label: 'Downloading Fallen World', slug: 'setup' },
  { label: 'Launching the Game', slug: 'launching' },
  {
    label: 'Gameplay Guide',
    collapsed: true,
    items: [
      { label: 'Overview', slug: 'gameplay/index' },
      { label: 'Survival', slug: 'gameplay/survival' },
      { label: 'Combat', slug: 'gameplay/combat' },
      { label: 'Controls', slug: 'gameplay/controls' },
      { label: 'Tips', slug: 'gameplay/tips' },
    ],
  },
  {
    label: 'FAQ & Troubleshooting',
    collapsed: true,
    items: [
      { label: 'FAQ Overview', slug: 'faq' },
      { label: 'General Questions', slug: 'faq/general' },
      { label: 'Technical', slug: 'faq/technical' },
      { label: 'Audio', slug: 'faq/audio' },
      { label: 'Installation', slug: 'faq/installation' },
      { label: 'Known Issues', slug: 'faq/known-issues' },
    ],
  },
  { label: 'Donations', slug: 'donations' },
];
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\data\nav.ts`.

- [ ] **Step 3: Copy docs/main → src/content/docs**

Run from `D:\Projects\AnomalyWebsite\websitedev-next`:

```powershell
New-Item -ItemType Directory -Force src\content\docs\faq
New-Item -ItemType Directory -Force src\content\docs\gameplay
Copy-Item docs\main\intro.md       src\content\docs\intro.mdx
Copy-Item docs\main\requirements.md src\content\docs\requirements.mdx
Copy-Item docs\main\setup.md       src\content\docs\setup.mdx
Copy-Item docs\main\launching.md   src\content\docs\launching.mdx
Copy-Item docs\main\gameplay.md    src\content\docs\gameplay.mdx
Copy-Item docs\main\donations.md   src\content\docs\donations.mdx
Copy-Item docs\main\faq.md         src\content\docs\faq.mdx
Copy-Item docs\main\faq\general.md        src\content\docs\faq\general.mdx
Copy-Item docs\main\faq\technical.md      src\content\docs\faq\technical.mdx
Copy-Item docs\main\faq\audio.md          src\content\docs\faq\audio.mdx
Copy-Item docs\main\faq\installation.md   src\content\docs\faq\installation.mdx
Copy-Item docs\main\faq\known-issues.md   src\content\docs\faq\known-issues.mdx
Copy-Item docs\main\gameplay\index.md     src\content\docs\gameplay\index.mdx
Copy-Item docs\main\gameplay\survival.md  src\content\docs\gameplay\survival.mdx
Copy-Item docs\main\gameplay\combat.md    src\content\docs\gameplay\combat.mdx
Copy-Item docs\main\gameplay\controls.md  src\content\docs\gameplay\controls.mdx
Copy-Item docs\main\gameplay\tips.md      src\content\docs\gameplay\tips.mdx
```

- [ ] **Step 4: Strip Docusaurus imports from all copied .mdx files**

The files contain lines like `import TerminalCard from '@site/src/components/TerminalCard';` which are invalid in Astro MDX content collections. Remove them with a PowerShell one-liner:

```powershell
Get-ChildItem src\content\docs -Recurse -Filter *.mdx | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $content = $content -replace "import \w+ from '@site/[^']+';`r?`n", ''
  $content = $content -replace "import \w+ from '@site/[^']+';`n", ''
  Set-Content $_.FullName $content -NoNewline
}
```

- [ ] **Step 5: Verify the frontmatter title field exists in all docs**

Most files have `title:` in frontmatter. Verify by checking a few:

```powershell
Select-String "^title:" src\content\docs\*.mdx
Select-String "^title:" src\content\docs\faq\*.mdx
Select-String "^title:" src\content\docs\gameplay\*.mdx
```

If any file is missing a `title:` field, open it and add one to the frontmatter block. The `config.ts` schema requires it.

- [ ] **Step 6: Strip Docusaurus imports from prismaui collection**

```powershell
Get-ChildItem src\content\prismaui -Filter *.md | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $content = $content -replace "import \w+ from '@site/[^']+';`r?`n", ''
  $content = $content -replace "import \w+ from '@site/[^']+';`n", ''
  Set-Content $_.FullName $content -NoNewline
}
```

- [ ] **Step 7: Verify no @site imports remain**

```powershell
Select-String "@site" src\content\docs -Recurse
Select-String "@site" src\content\prismaui
```

Expected: no matches.

- [ ] **Step 8: Commit**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
git add src/content/config.ts src/content/docs/ src/data/nav.ts
git commit -m "feat: content collections config + migrate docs to MDX"
```

---

## Task 5: Docs slug page

**Files:**
- Create: `src/pages/docs/[...slug].astro`

This page renders all entries from the `docs` collection. It includes a left sidebar using `nav.ts` and the main content area.

- [ ] **Step 1: Create src/pages/docs/[...slug].astro**

```astro
---
// src/pages/docs/[...slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import TerminalCard from '../../components/TerminalCard.astro';
import LinkCard from '../../components/LinkCard.astro';
import { docsNav, isNavGroup } from '../../data/nav';

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const currentSlug = entry.slug;
---

<Layout title={entry.data.title}>
  <div class="mx-auto flex max-w-6xl gap-8 px-6 py-10">
    <!-- Sidebar -->
    <aside class="hidden w-56 shrink-0 lg:block">
      <nav class="sticky top-20">
        <ul class="space-y-1 text-sm">
          {docsNav.map((item) => {
            if (isNavGroup(item)) {
              return (
                <li>
                  <details open class="group">
                    <summary class="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 font-semibold text-gray-400 hover:bg-white/5 hover:text-gray-200 select-none">
                      {item.label}
                      <span class="transition-transform group-open:rotate-180">▾</span>
                    </summary>
                    <ul class="mt-1 ml-3 space-y-0.5">
                      {item.items.map((child) => (
                        <li>
                          <a
                            href={`/docs/${child.slug}`}
                            class={`block rounded px-2 py-1 transition-colors hover:text-emerald-400 ${
                              currentSlug === child.slug
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-gray-400'
                            }`}
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            }
            return (
              <li>
                <a
                  href={`/docs/${item.slug}`}
                  class={`block rounded px-2 py-1.5 font-medium transition-colors hover:text-emerald-400 ${
                    currentSlug === item.slug
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>

    <!-- Content -->
    <article class="prose-doc min-w-0 flex-1">
      {!entry.data.hide_title && <h1>{entry.data.title}</h1>}
      <Content components={{ TerminalCard, LinkCard }} />
    </article>
  </div>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\docs\[...slug].astro`.

**Note:** The spec originally used `/[...slug].astro` at the pages root but `/docs/[...slug].astro` is cleaner — the nav links in `nav.ts` and `Header.astro` already use `/docs/intro` etc. If the spec needs top-level slugs (`/intro`, `/faq/general`), move the file to `src/pages/[...slug].astro` instead and update nav link hrefs accordingly.

- [ ] **Step 2: Verify the build compiles the docs pages**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
npm run build 2>&1 | Select-String -Pattern "error|warn|Error|Warn" | Select-Object -First 20
```

Expected: build completes. Common errors at this stage:
- Missing `title` frontmatter in a doc file — fix by adding `title: "..."` to that file's frontmatter block
- Type error on frontmatter schema — fix the value in the file

- [ ] **Step 3: Test docs in dev**

```powershell
npm run dev
```

Open `http://localhost:4321/docs/intro` in a browser. Verify:
- Sidebar renders with all nav entries
- Content renders with TerminalCard styled
- Admonitions (`:::warning`) render as styled divs
- Images and links work

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/docs/
git commit -m "feat: docs slug page with sidebar"
```

---

## Task 6: PrismaUI pages

**Files:**
- Create: `src/pages/prismaui-f4/index.astro`
- Create: `src/pages/prismaui-f4/[section].astro`

- [ ] **Step 1: Create [section].astro**

```astro
---
// src/pages/prismaui-f4/[section].astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('prismaui');
  return entries.map((entry) => ({
    params: { section: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();

const allEntries = await getCollection('prismaui');
const sidebarOrder = [
  'getting-started',
  'api-reference',
  'html-views',
  'examples',
  'view-lifecycle',
  'papyrus-bridge',
  'prismamcm',
  'modern-frameworks',
  'translations',
  'limitations',
  'CHANGELOG',
];
const sorted = sidebarOrder
  .map((slug) => allEntries.find((e) => e.slug === slug))
  .filter(Boolean);
---

<Layout title={entry.data.title ?? 'PrismaUI F4'}>
  <div class="mx-auto flex max-w-6xl gap-8 px-6 py-10">
    <!-- Sidebar -->
    <aside class="hidden w-56 shrink-0 lg:block">
      <nav class="sticky top-20">
        <div class="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">
          PrismaUI F4
        </div>
        <ul class="space-y-0.5 text-sm">
          {sorted.map((e) => (
            <li>
              <a
                href={`/prismaui-f4/${e!.slug}`}
                class={`block rounded px-2 py-1 transition-colors hover:text-emerald-400 ${
                  entry.slug === e!.slug
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-400'
                }`}
              >
                {e!.data.title ?? e!.slug}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>

    <!-- Content -->
    <article class="prose-doc min-w-0 flex-1">
      <Content />
    </article>
  </div>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\prismaui-f4\[section].astro`.

- [ ] **Step 2: Create prismaui-f4/index.astro**

```astro
---
// src/pages/prismaui-f4/index.astro
import Layout from '../../layouts/Layout.astro';
---

<Layout title="PrismaUI F4 — Fallout 4 UI Framework">
  <div class="mx-auto max-w-4xl px-6 py-20 text-center">
    <div class="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">
      Framework
    </div>
    <h1 class="mb-4 text-4xl font-extrabold tracking-tight text-white uppercase">
      PrismaUI F4
    </h1>
    <p class="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
      A Fallout 4 UI framework built on Ultralight — create HTML/CSS/JS panels that render in-game through F4SE. Zero Scaleform. Zero Flash.
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <a
        href="/prismaui-f4/getting-started"
        class="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 transition-colors"
      >
        Get Started
      </a>
      <a
        href="/prismaui-f4/api-reference"
        class="rounded-md border border-white/20 px-5 py-2.5 font-semibold text-gray-300 hover:border-white/40 hover:text-white transition-colors"
      >
        API Reference
      </a>
      <a
        href="https://www.nexusmods.com/fallout4/mods/TODO"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-md border border-white/20 px-5 py-2.5 font-semibold text-gray-300 hover:border-white/40 hover:text-white transition-colors"
      >
        Download on Nexus ↗
      </a>
    </div>

    <!-- Doc cards -->
    <div class="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
      {[
        { href: '/prismaui-f4/getting-started', title: 'Getting Started', desc: 'Install and create your first view in minutes.' },
        { href: '/prismaui-f4/api-reference', title: 'API Reference', desc: 'Full reference for IVPrismaUI2 and helper types.' },
        { href: '/prismaui-f4/html-views', title: 'HTML Views', desc: 'How to structure HTML, CSS, and assets for in-game panels.' },
        { href: '/prismaui-f4/examples', title: 'Examples', desc: 'Copy-paste patterns for common use cases.' },
        { href: '/prismaui-f4/papyrus-bridge', title: 'Papyrus Bridge', desc: 'Call Papyrus scripts from your panel JS.' },
        { href: '/prismaui-f4/view-lifecycle', title: 'View Lifecycle', desc: 'Timing rules for CreateView, DOM ready, and reloads.' },
      ].map(({ href, title, desc }) => (
        <a
          href={href}
          class="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-emerald-500/30 hover:bg-white/10"
        >
          <div class="mb-1 font-semibold text-white">{title}</div>
          <div class="text-sm text-gray-400">{desc}</div>
        </a>
      ))}
    </div>
  </div>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\prismaui-f4\index.astro`.

**Note:** The Nexus mod URL on the download button contains `TODO` — replace with the real URL before launch.

- [ ] **Step 3: Add missing title frontmatter to prismaui collection files that lack it**

The `prismaui` collection schema marks `title` as optional, so missing titles just render the `slug` as the sidebar label. If you want proper titles:

```powershell
# Check which files lack a title
Get-ChildItem src\content\prismaui -Filter *.md | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -notmatch '^---[\s\S]*?title:') {
    Write-Host "MISSING TITLE: $($_.Name)"
  }
}
```

For any file missing a title, open it and add a `title:` to the YAML frontmatter. Example for `api-reference.md` if it has no frontmatter at all:

```markdown
---
title: API Reference
---

(existing content)
```

- [ ] **Step 4: Verify**

```powershell
npm run dev
```

Open `http://localhost:4321/prismaui-f4` — verify showcase landing. Open `http://localhost:4321/prismaui-f4/getting-started` — verify sidebar and content render. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/prismaui-f4/
git commit -m "feat: PrismaUI F4 showcase and doc pages"
```

---

## Task 7: Home page

**Files:**
- Create: `src/pages/index.astro`

The home page uses the design from `src/styles/index.module.css`: full-viewport YouTube video background, hero text, and gallery section with images and video embeds.

- [ ] **Step 1: Create src/pages/index.astro**

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import galleryData from '../data/gallery.json';
---

<Layout title="Fallen World — Hardcore Survival for Fallout 4">
  <!-- Hero with video background -->
  <section style="position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden;">
    <div class="hero-video-wrap">
      <div class="hero-video-scrim"></div>
      <iframe
        class="hero-video-iframe"
        src="https://www.youtube.com/embed/yfthfcz4EBY?autoplay=1&mute=1&loop=1&playlist=yfthfcz4EBY&controls=0&showinfo=0&rel=0&enablejsapi=1"
        title="Fallen World background"
        frameborder="0"
        allow="autoplay"
        aria-hidden="true"
      ></iframe>
    </div>

    <div style="position: relative; z-index: 2; text-align: center; max-width: 700px; padding: 2rem;">
      <div style="margin-bottom: 1rem;">
        <img
          src="/img/favicon.svg"
          alt="Fallen World"
          style="max-width: 120px; width: 100%; height: auto; filter: drop-shadow(0 0 12px rgba(13,148,136,0.4)); animation: pulse 3s ease-in-out infinite;"
        />
      </div>
      <h1 style="margin: 0 0 0.5rem; font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800; color: #f5f5f5; letter-spacing: 0.15em; text-transform: uppercase; text-shadow: 0 0 30px rgba(13,148,136,0.3); line-height: 1.1;">
        Fallen World
      </h1>
      <p style="margin: 0 0 1.5rem; font-size: 1.15rem; color: #9ca3af;">
        The #1 hardcore survival experience for Fallout 4
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">
        <a
          href="https://www.wabbajack.org/"
          target="_blank"
          rel="noopener noreferrer"
          style="display: inline-block; padding: 0.75rem 1.75rem; background: #0d9488; color: #fff; font-weight: 700; border-radius: 6px; text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.9rem; transition: background 0.2s;"
        >
          Install with Wabbajack
        </a>
        <a
          href="/docs/intro"
          style="display: inline-block; padding: 0.75rem 1.75rem; border: 2px solid rgba(255,255,255,0.2); color: #e5e7eb; font-weight: 600; border-radius: 6px; text-decoration: none; font-size: 0.9rem; transition: border-color 0.2s, color 0.2s;"
        >
          Read the Guide
        </a>
      </div>

      <!-- Stats bar -->
      <div style="display: flex; justify-content: center; gap: 2.5rem; margin-top: 2.5rem; flex-wrap: wrap;">
        {[
          { value: '100K+', label: 'Downloads' },
          { value: '600+', label: 'Mods Included' },
          { value: 'Wabbajack', label: 'One-Click Install' },
        ].map(({ value, label }) => (
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #0d9488;">{value}</div>
            <div style="font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Gallery section -->
  <section style="background: #0a0a0a; padding: 5rem 1.5rem;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #0d9488; margin-bottom: 0.5rem;">Gallery</div>
        <h2 style="font-size: 2rem; font-weight: 800; color: #f5f5f5; text-transform: uppercase; letter-spacing: 0.1em;">The Wasteland Awaits</h2>
      </div>

      <!-- Screenshots grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 3rem;">
        {galleryData.images.map((src) => (
          <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 6px; border: 1px solid #374151;">
            <img
              src={src}
              alt="Fallen World screenshot"
              loading="lazy"
              style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
              onmouseover="this.style.transform='scale(1.04)'"
              onmouseout="this.style.transform='scale(1)'"
            />
          </div>
        ))}
      </div>

      <!-- Video embeds -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem;">
        {galleryData.videos.map((video) => (
          <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; border: 1px solid #374151;">
            <iframe
              src={video.src}
              title={video.title}
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              style="width: 100%; height: 100%;"
              loading="lazy"
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer style="background: #0a0a0a; border-top: 1px solid #1f2937; padding: 2rem 1.5rem; text-align: center;">
    <div style="font-size: 0.8rem; color: #6b7280;">
      Fallen World is an unofficial fan project. Not affiliated with Bethesda Game Studios.
      <span style="margin: 0 0.5rem;">·</span>
      <a href="https://discord.gg/fallenworld" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: none;">Discord</a>
      <span style="margin: 0 0.5rem;">·</span>
      <a href="https://loadorderlibrary.com/lists/fallout-anomaly-0-5" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: none;">Modlist</a>
    </div>
  </footer>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\index.astro`.

- [ ] **Step 2: Verify home page in dev**

```powershell
npm run dev
```

Open `http://localhost:4321`. Verify: video background plays muted, hero text visible, CTA buttons work, gallery images load. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```powershell
git add src/pages/index.astro
git commit -m "feat: home page with hero and gallery"
```

---

## Task 8: Static pages

**Files:**
- Create: `src/pages/apply.astro`
- Create: `src/pages/community.astro`
- Create: `src/pages/wiki.astro`
- Create: `src/pages/roadmap.astro`

- [ ] **Step 1: Create apply.astro**

```astro
---
// src/pages/apply.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="Apply — Fallen World">
  <div class="mx-auto max-w-2xl px-6 py-20 text-center">
    <div class="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">Community</div>
    <h1 class="mb-4 text-4xl font-extrabold uppercase tracking-tight text-white">Apply to the Team</h1>
    <p class="mb-10 text-lg text-gray-400">
      Want to help build Fallen World? We're looking for passionate contributors — modders, artists, writers, and testers.
    </p>
    <a
      href="https://forms.fillout.com/t/TODO"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-block rounded-md bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-500 transition-colors"
    >
      Open Application Form ↗
    </a>
    <p class="mt-6 text-sm text-gray-500">
      Opens in Fillout. No account required.
    </p>
  </div>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\apply.astro`.

**Note:** The Fillout form URL contains `TODO` — replace with the actual Fillout form URL before launch.

- [ ] **Step 2: Create community.astro**

```astro
---
// src/pages/community.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="Community — Fallen World">
  <div class="mx-auto max-w-2xl px-6 py-20 text-center">
    <div class="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500">Community</div>
    <h1 class="mb-4 text-4xl font-extrabold uppercase tracking-tight text-white">Join the Community</h1>
    <p class="mb-10 text-lg text-gray-400">
      Get support, report issues, share screenshots, and connect with thousands of Fallen World survivors.
    </p>
    <a
      href="https://discord.gg/fallenworld"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-3 rounded-md bg-[#5865F2] px-8 py-3 font-semibold text-white hover:bg-[#4752c4] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" class="h-6 w-6 fill-white">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
      </svg>
      Join on Discord
    </a>
    <p class="mt-6 text-sm text-gray-500">
      Over 5,000 members · Active support channels · Screenshots and clips
    </p>
  </div>
</Layout>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\community.astro`.

- [ ] **Step 3: Create wiki.astro**

```astro
---
// src/pages/wiki.astro
---
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=https://wiki.gg/wiki/FallenWorld" />
    <title>Redirecting to Wiki...</title>
  </head>
  <body>
    <p>Redirecting to the <a href="https://wiki.gg/wiki/FallenWorld">Fallen World Wiki</a>...</p>
  </body>
</html>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\wiki.astro`.

**Note:** The wiki URL is a placeholder — replace `https://wiki.gg/wiki/FallenWorld` with the real Wiki.gg URL when it's set up.

- [ ] **Step 4: Create roadmap.astro**

```astro
---
// src/pages/roadmap.astro
---
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=https://trello.com/b/TODO/fallen-world" />
    <title>Redirecting to Roadmap...</title>
  </head>
  <body>
    <p>Redirecting to the <a href="https://trello.com/b/TODO/fallen-world">Fallen World Roadmap</a>...</p>
  </body>
</html>
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\src\pages\roadmap.astro`.

**Note:** Replace the Trello URL with the real board URL when it's created.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/apply.astro src/pages/community.astro src/pages/wiki.astro src/pages/roadmap.astro
git commit -m "feat: static pages — apply, community, wiki, roadmap"
```

---

## Task 9: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Save to `D:\Projects\AnomalyWebsite\websitedev-next\.github\workflows\deploy.yml`.

- [ ] **Step 2: Verify the full build succeeds locally**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
npm run build
```

Expected: `dist/` folder created, no build errors. Check the output for the page count — should include all docs pages, prismaui pages, and static pages.

If there are TypeScript errors in `.astro` files, fix them before committing.

- [ ] **Step 3: Commit**

```powershell
git add .github/
git commit -m "feat: GitHub Actions deploy workflow"
```

---

## Task 10: Cleanup — remove Next.js artifacts

**Files:**
- Delete: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`
- Delete: `src/styles/index.module.css`
- Delete: `src/data/sidebars.js`
- Delete: `.env.example` (all entries are Supabase/Next.js specific — no env needed for static Astro)
- Delete: `.env.local` if it exists and contains Supabase credentials
- Delete: `public/vendor/widgetbot-crate.js` (Discord widget, no longer needed)

- [ ] **Step 1: Delete Next.js placeholder SVGs**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
Remove-Item public\next.svg -Force
Remove-Item public\vercel.svg -Force
Remove-Item public\file.svg -Force
Remove-Item public\globe.svg -Force
Remove-Item public\window.svg -Force
```

- [ ] **Step 2: Delete legacy source files**

```powershell
Remove-Item src\styles\index.module.css -Force
Remove-Item src\data\sidebars.js -Force
Remove-Item public\vendor\widgetbot-crate.js -Force
Remove-Item .env.example -Force
```

- [ ] **Step 3: Delete .env.local if present**

Check its contents first — if it only has Supabase/DB entries (which are all compromised and rotated), delete it:

```powershell
Get-Content .env.local
```

If it only has the old Supabase/database vars (no Astro-relevant vars), delete it:

```powershell
Remove-Item .env.local -Force
```

- [ ] **Step 4: Final build verify**

```powershell
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 5: Final commit**

```powershell
git add -A
git commit -m "chore: remove Next.js artifacts and legacy files"
```

---

## Task 11: GitHub repository setup and first deploy

This task sets up the GitHub repository to receive the site and enables GitHub Pages. Do this after all code is committed locally.

- [ ] **Step 1: Create a new GitHub repository**

Go to `https://github.com/new`. Create a new repository:
- Name: `fallenworld-website` (or `websitedev-next`)
- Visibility: **Public** (required for GitHub Pages on free tier)
- Do NOT initialize with README

- [ ] **Step 2: Add remote and push**

```powershell
cd D:\Projects\AnomalyWebsite\websitedev-next
git remote add origin https://github.com/NomadsReach/<repo-name>.git
git push -u origin main
```

Replace `<repo-name>` with the actual repo name created in Step 1.

- [ ] **Step 3: Enable GitHub Pages in repo settings**

1. Go to the repo on GitHub → Settings → Pages
2. Source: **GitHub Actions** (not branch)
3. Save

- [ ] **Step 4: Verify the Actions workflow runs**

Go to the repo → Actions tab. The deploy workflow should have triggered from the push. Watch it run — it should complete in ~2 minutes and show the deployed URL.

- [ ] **Step 5: Configure DNS via Cloudflare**

In Cloudflare DNS for `fallenworld.nexus`:
1. Delete or disable any existing A/CNAME records pointing to the old VPS IP
2. Add a new CNAME record:
   - Name: `@` (or `fallenworld.nexus`)
   - Target: `nomadsreach.github.io`
   - Proxy: **ON** (orange cloud, for DDoS protection)

- [ ] **Step 6: Add custom domain in GitHub Pages settings**

Back in repo Settings → Pages:
- Custom domain: `fallenworld.nexus`
- Check "Enforce HTTPS"

GitHub will create a `CNAME` file in the repo root automatically.

- [ ] **Step 7: Verify live site**

Wait 5 minutes for DNS propagation, then open `https://fallenworld.nexus`. Verify:
- Home page loads with video background
- `/docs/intro` renders with sidebar
- `/prismaui-f4/getting-started` renders
- Discord nav button works
- No 404s on static pages

---

## TODOs Before Go-Live

After the initial deploy, update these placeholder values:

| Location | What to update |
|----------|---------------|
| `src/components/Header.astro:23` | Real Discord invite URL (replace `discord.gg/fallenworld`) |
| `src/pages/index.astro` (footer) | Same Discord URL |
| `src/pages/community.astro` | Same Discord URL |
| `src/pages/apply.astro` | Real Fillout form URL |
| `src/pages/wiki.astro` | Real Wiki.gg URL |
| `src/pages/roadmap.astro` | Real Trello board URL |
| `src/pages/prismaui-f4/index.astro` | Real Nexus mod URL |
| `src/pages/index.astro` (hero video) | Confirm `yfthfcz4EBY` is still the correct YouTube ID |
