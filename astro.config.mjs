import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

function remarkAdmonitions() {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' &&
        ['warning', 'tip', 'info', 'danger', 'important'].includes(node.name)
      ) {
        const label = node.children.find((child) => child.type === 'directiveLabel');
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

const PRISMA_DOCS = 'https://prisma-user-interface-framework.github.io/Prisma2.0/docs/getting-started';

export default defineConfig({
  site: 'https://fallenworld.nexus',
  base: '/',
  redirects: {
    '/prismaui-f4': PRISMA_DOCS,
    '/prismaui-f4/getting-started': PRISMA_DOCS,
    '/roadmap': '/',
    '/wiki': '/docs/intro',
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkDirective, remarkAdmonitions],
    }),
  ],
});
