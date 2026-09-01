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

const wiki = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(wikiCategories),
    type: z.enum(['official', 'community']),
    status: z.enum(['current', 'needs-review', 'outdated', 'archived']).default('current'),
    fallenWorldVersion: z.string(),
    updated: z.string(),
    lastTested: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all']).default('all'),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    related: z.array(z.string()).default([]),
  }),
});

const knoxChangelog = defineCollection({
  loader: glob({ pattern: 'CHANGELOG.md', base: './' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { docs, wiki, knoxChangelog };
