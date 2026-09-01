import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const wikiDir = path.resolve('src/content/wiki');
const publicDir = path.resolve('public');
const failures = [];
const pages = [];

const allowedCategories = new Set([
  'getting-started',
  'gameplay',
  'survival-systems',
  'combat',
  'crafting',
  'settlements',
  'mods',
  'performance',
  'troubleshooting',
  'installation-updating',
  'builds-loadouts',
  'world-locations',
  'community-guides',
  'developer-documentation',
]);
const allowedTypes = new Set(['official', 'community']);
const allowedStatuses = new Set(['current', 'needs-review', 'outdated', 'archived']);
const allowedDifficulties = new Set(['beginner', 'intermediate', 'advanced', 'all']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(md|mdx)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function relative(file) {
  return path.relative(wikiDir, file).split(path.sep).join('/');
}

function slugFor(file) {
  return relative(file).replace(/\.(md|mdx)$/i, '');
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

const files = await walk(wikiDir);
const slugs = new Set();

for (const file of files) {
  const rel = relative(file);
  const slug = slugFor(file);
  const source = await readFile(file, 'utf8');
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatterMatch) {
    failures.push(`${rel}: missing YAML frontmatter`);
    continue;
  }

  const frontmatter = frontmatterMatch[1];
  const values = {
    title: scalar(frontmatter, 'title'),
    description: scalar(frontmatter, 'description'),
    category: scalar(frontmatter, 'category'),
    type: scalar(frontmatter, 'type'),
    status: scalar(frontmatter, 'status'),
    fallenWorldVersion: scalar(frontmatter, 'fallenWorldVersion'),
    updated: scalar(frontmatter, 'updated'),
    lastTested: scalar(frontmatter, 'lastTested'),
    difficulty: scalar(frontmatter, 'difficulty'),
    author: scalar(frontmatter, 'author'),
  };

  for (const key of ['title', 'description', 'category', 'type', 'status', 'fallenWorldVersion', 'updated', 'difficulty']) {
    if (!values[key]) failures.push(`${rel}: missing required field ${key}`);
  }

  if (!allowedCategories.has(values.category)) failures.push(`${rel}: invalid category ${values.category}`);
  if (!allowedTypes.has(values.type)) failures.push(`${rel}: invalid type ${values.type}`);
  if (!allowedStatuses.has(values.status)) failures.push(`${rel}: invalid status ${values.status}`);
  if (!allowedDifficulties.has(values.difficulty)) failures.push(`${rel}: invalid difficulty ${values.difficulty}`);

  if (values.type === 'community') {
    if (!values.author.startsWith('@')) failures.push(`${rel}: community guides must include author as @GitHubUsername`);
    if (!values.lastTested) failures.push(`${rel}: community guides must include lastTested`);
  }

  if (slugs.has(slug)) failures.push(`${rel}: duplicate wiki slug ${slug}`);
  slugs.add(slug);
  pages.push({ rel, slug, source });

  for (const match of source.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/gi)) {
    failures.push(`${rel}: external image host is not allowed (${match[1]})`);
  }

  const localImages = [
    ...source.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)[^)]*\)/g),
    ...source.matchAll(/\bsrc=["'](\/[^"']+)["']/gi),
  ].map((match) => match[1]);

  for (const imageUrl of localImages) {
    if (!imageUrl.startsWith('/img/')) continue;
    const diskPath = path.join(publicDir, imageUrl.replace(/^\//, ''));
    try {
      await access(diskPath);
    } catch {
      failures.push(`${rel}: missing local media ${imageUrl}`);
    }
  }
}

for (const page of pages) {
  for (const match of page.source.matchAll(/\]\((\/wiki\/[^)#?\s]+)[^)]*\)/g)) {
    const target = match[1].replace(/^\/wiki\//, '').replace(/\/$/, '');
    if (target && !slugs.has(target)) failures.push(`${page.rel}: broken wiki link ${match[1]}`);
  }
}

if (failures.length) {
  console.error('Wiki validation failed:');
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Wiki validation passed for ${pages.length} content pages.`);
