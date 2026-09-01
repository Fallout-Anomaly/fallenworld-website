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
const allowedCommunityHtmlTags = new Set(['details', 'summary']);
const githubAuthorPattern = /^@[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

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

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return match ? unquote(match[1]) : '';
}

function stringList(frontmatter, key) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*`).test(line));
  if (start === -1) return [];

  const inline = lines[start].replace(new RegExp(`^${key}:\\s*`), '').trim();
  if (inline === '[]') return [];
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return inline.slice(1, -1).split(',').map(unquote).filter(Boolean);
  }
  if (inline) return [];

  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/^\s+/.test(line)) break;
    const match = line.match(/^\s*-\s*(.+?)\s*$/);
    if (match) values.push(unquote(match[1]));
  }
  return values;
}

function withoutCodeFences(source) {
  return source.replace(/```[\s\S]*?```/g, '');
}

function isIsoDate(value) {
  if (!isoDatePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateCommunityMarkup(rel, body) {
  for (const match of body.matchAll(/<\s*\/?\s*([A-Za-z][\w-]*)(?=\s|\/?>)[^>]*>/g)) {
    const tag = match[1].toLowerCase();
    if (!allowedCommunityHtmlTags.has(tag)) {
      failures.push(`${rel}: community guides may only use raw <details> and <summary> HTML`);
      break;
    }
  }

  if (/\bon[a-z]+\s*=/i.test(body)) failures.push(`${rel}: inline event handlers are not allowed`);
  if (/\bjavascript\s*:/i.test(body)) failures.push(`${rel}: javascript: URLs are not allowed`);
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
  const body = withoutCodeFences(source.slice(frontmatterMatch[0].length));
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
  const related = stringList(frontmatter, 'related');

  for (const key of ['title', 'description', 'category', 'type', 'status', 'fallenWorldVersion', 'updated', 'difficulty']) {
    if (!values[key]) failures.push(`${rel}: missing required field ${key}`);
  }

  if (!allowedCategories.has(values.category)) failures.push(`${rel}: invalid category ${values.category}`);
  if (!allowedTypes.has(values.type)) failures.push(`${rel}: invalid type ${values.type}`);
  if (!allowedStatuses.has(values.status)) failures.push(`${rel}: invalid status ${values.status}`);
  if (!allowedDifficulties.has(values.difficulty)) failures.push(`${rel}: invalid difficulty ${values.difficulty}`);
  if (values.updated && !isIsoDate(values.updated)) failures.push(`${rel}: updated must be a real YYYY-MM-DD date`);
  if (values.lastTested && !isIsoDate(values.lastTested)) failures.push(`${rel}: lastTested must be a real YYYY-MM-DD date`);

  if (values.type === 'community') {
    if (!githubAuthorPattern.test(values.author)) failures.push(`${rel}: community guides must include a valid author as @GitHubUsername`);
    if (!values.lastTested) failures.push(`${rel}: community guides must include lastTested`);
    if (!rel.toLowerCase().endsWith('.md')) failures.push(`${rel}: community guides must use .md, not MDX`);
    validateCommunityMarkup(rel, body);
  }

  if (/\bjavascript\s*:/i.test(body)) failures.push(`${rel}: javascript: URLs are not allowed`);
  if (/\bon[a-z]+\s*=/i.test(body)) failures.push(`${rel}: inline event handlers are not allowed`);

  if (slugs.has(slug)) failures.push(`${rel}: duplicate wiki slug ${slug}`);
  slugs.add(slug);
  pages.push({ rel, slug, body, related });

  for (const match of body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/gi)) {
    failures.push(`${rel}: external image host is not allowed (${match[1]})`);
  }
  for (const match of body.matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)/gi)) {
    failures.push(`${rel}: external image host is not allowed (${match[1]})`);
  }

  const localImages = [
    ...body.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)[^)]*\)/g),
    ...body.matchAll(/\bsrc=["'](\/[^"']+)["']/gi),
  ].map((match) => match[1]);

  for (const imageUrl of localImages) {
    const cleanUrl = imageUrl.split(/[?#]/, 1)[0];
    if (values.type === 'community' && !cleanUrl.startsWith('/img/wiki/')) {
      failures.push(`${rel}: community guide media must live under /img/wiki/`);
      continue;
    }
    if (!cleanUrl.startsWith('/img/')) continue;
    if (cleanUrl.includes('..')) {
      failures.push(`${rel}: media paths may not contain .. (${imageUrl})`);
      continue;
    }

    const diskPath = path.resolve(publicDir, cleanUrl.replace(/^\//, ''));
    if (!diskPath.startsWith(`${publicDir}${path.sep}`)) {
      failures.push(`${rel}: media path escapes public directory (${imageUrl})`);
      continue;
    }

    try {
      await access(diskPath);
    } catch {
      failures.push(`${rel}: missing local media ${imageUrl}`);
    }
  }
}

for (const page of pages) {
  for (const match of page.body.matchAll(/\]\((\/wiki\/[^)#?\s]+)[^)]*\)/g)) {
    const target = match[1].replace(/^\/wiki\//, '').replace(/\/$/, '');
    if (target && !slugs.has(target)) failures.push(`${page.rel}: broken wiki link ${match[1]}`);
  }

  const seenRelated = new Set();
  for (const target of page.related) {
    if (target === page.slug) failures.push(`${page.rel}: related may not reference itself`);
    if (seenRelated.has(target)) failures.push(`${page.rel}: duplicate related guide ${target}`);
    if (!slugs.has(target)) failures.push(`${page.rel}: related guide does not exist (${target})`);
    seenRelated.add(target);
  }
}

if (failures.length) {
  console.error('Wiki validation failed:');
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Wiki validation passed for ${pages.length} content pages.`);
