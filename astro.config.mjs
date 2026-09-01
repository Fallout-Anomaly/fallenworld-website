import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const PRISMA_DOCS = 'https://prisma-user-interface-framework.github.io/Prisma2.0/docs/getting-started';

export default defineConfig({
  site: 'https://fallenworld.nexus',
  base: '/',
  redirects: {
    '/prismaui-f4': PRISMA_DOCS,
    '/prismaui-f4/getting-started': PRISMA_DOCS,
  },
  integrations: [mdx()],
});
