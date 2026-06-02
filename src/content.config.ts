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

const prismaui = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prismaui' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { docs, prismaui };
