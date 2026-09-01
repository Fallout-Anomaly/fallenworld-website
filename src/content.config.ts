import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    sidebar_label: z.string().optional(),
    sidebar_position: z.number().optional(),
    hide_title: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const wikiCategories = [
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
] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const githubAuthor = z.string().regex(
  /^@[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
  'Use a valid @GitHubUsername',
);

const wikiSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(wikiCategories),
  type: z.enum(['official', 'community']),
  status: z.enum(['current', 'outdated']).default('current'),
  updated: isoDate,
  lastTested: isoDate.optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all']).default('all'),
  tags: z.array(z.string().min(1)).default([]),
  author: githubAuthor.optional(),
  featured: z.boolean().default(false),
  order: z.number().default(100),
  related: z.array(z.string().min(1)).default([]),
}).superRefine((data, ctx) => {
  if (data.type !== 'community') return;

  if (!data.author) {
    ctx.addIssue({
      code: 'custom',
      path: ['author'],
      message: 'Community guides must include author as @GitHubUsername',
    });
  }

  if (!data.lastTested) {
    ctx.addIssue({
      code: 'custom',
      path: ['lastTested'],
      message: 'Community guides must include lastTested',
    });
  }
});

const wiki = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki' }),
  schema: wikiSchema,
});

const knoxChangelog = defineCollection({
  loader: glob({ pattern: 'CHANGELOG.md', base: './' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { docs, wiki, knoxChangelog };
