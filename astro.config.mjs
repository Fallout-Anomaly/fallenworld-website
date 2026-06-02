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
    mdx({
      remarkPlugins: [remarkDirective, remarkAdmonitions],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
