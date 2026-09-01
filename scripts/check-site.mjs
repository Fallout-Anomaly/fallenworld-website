import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function pageUrlFor(file) {
  const rel = toPosix(path.relative(distDir, file));
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function internalCandidates(pathname) {
  let clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!clean) return ['index.html'];
  if (clean.endsWith('/')) clean += 'index.html';

  const candidates = [clean];
  if (!path.posix.extname(clean)) {
    candidates.push(`${clean}.html`);
    candidates.push(`${clean}/index.html`);
  }
  return candidates;
}

const allFiles = await walk(distDir);
const fileSet = new Set(allFiles.map((file) => toPosix(path.relative(distDir, file))));
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const failures = [];

const requiredPageMarkers = new Map([
  ['wiki/index.html', 'id="wiki-search"'],
  ['wiki/mods/index.html', 'id="mod-search"'],
  ['wiki/troubleshooting/index.html', 'id="troubleshooting-search"'],
]);

for (const [rel, marker] of requiredPageMarkers) {
  if (!fileSet.has(rel)) {
    failures.push(`${rel}: required wiki route was not generated`);
    continue;
  }

  const html = await readFile(path.join(distDir, rel), 'utf8');
  if (!html.includes(marker)) failures.push(`${rel}: expected wiki page marker is missing`);
}

const bannedPatterns = [
  { pattern: /—/u, label: 'em dash' },
  { pattern: /forms\.fillout\.com\/t\/TODO/i, label: 'placeholder application URL' },
  { pattern: /TAueAV8Utk|bawdketrFX/, label: 'stale Discord invite' },
  { pattern: /:::(warning|tip|info|danger|important)\b/i, label: 'unrendered admonition directive' },
  { pattern: /\bTODO\b/, label: 'TODO placeholder' },
];

for (const file of htmlFiles) {
  const rel = toPosix(path.relative(distDir, file));
  const html = await readFile(file, 'utf8');

  for (const { pattern, label } of bannedPatterns) {
    if (pattern.test(html)) failures.push(`${rel}: contains ${label}`);
  }

  const pageUrl = pageUrlFor(file);
  const hrefPattern = /\bhref=["']([^"']+)["']/gi;
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1].trim();
    if (
      !href ||
      href.startsWith('#') ||
      /^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)
    ) continue;

    let resolved;
    try {
      resolved = new URL(href, `https://local.test${pageUrl}`);
    } catch {
      failures.push(`${rel}: invalid href ${href}`);
      continue;
    }

    if (resolved.origin !== 'https://local.test') continue;
    const candidates = internalCandidates(resolved.pathname);
    if (!candidates.some((candidate) => fileSet.has(candidate))) {
      failures.push(`${rel}: broken internal link ${href}`);
    }
  }
}

if (failures.length) {
  console.error('Site verification failed:');
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site verification passed for ${htmlFiles.length} generated HTML pages.`);
