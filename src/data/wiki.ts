export const wikiCategories = [
  { slug: 'getting-started', label: 'Getting Started', description: 'Install, launch, and understand the first hours of Fallen World.' },
  { slug: 'gameplay', label: 'Gameplay', description: 'Core gameplay systems, progression, and general player guides.' },
  { slug: 'survival-systems', label: 'Survival Systems', description: 'Needs, injuries, radiation, weather, hunting, and survival mechanics.' },
  { slug: 'combat', label: 'Combat', description: 'Ballistics, armor, weapons, damage, and combat tactics.' },
  { slug: 'crafting', label: 'Crafting', description: 'Benches, recipes, upgrades, ammunition, and resource workflows.' },
  { slug: 'settlements', label: 'Settlements', description: 'Workshop Rebuilt, building, supply lines, and settlement systems.' },
  { slug: 'mods', label: 'Mods', description: 'Detailed pages for included and Fallen World-developed mods.' },
  { slug: 'performance', label: 'Performance', description: 'FPS, stability, graphics, load times, and hardware guidance.' },
  { slug: 'troubleshooting', label: 'Troubleshooting', description: 'Crash symptoms, errors, broken features, and known fixes.' },
  { slug: 'installation-updating', label: 'Installation & Updating', description: 'Install, update, repair, and migration instructions.' },
  { slug: 'builds-loadouts', label: 'Builds & Loadouts', description: 'Character builds, equipment plans, and community loadouts.' },
  { slug: 'world-locations', label: 'World & Locations', description: 'Locations, encounters, secrets, routes, and spoiler-aware guides.' },
  { slug: 'community-guides', label: 'Community Guides', description: 'Player-created guides reviewed through GitHub pull requests.' },
  { slug: 'developer-documentation', label: 'Developer Documentation', description: 'Technical implementation, integrations, schemas, and APIs.' },
] as const;

export type WikiCategorySlug = typeof wikiCategories[number]['slug'];

export const wikiRepository = 'Fallout-Anomaly/fallenworld-website';
export const wikiRepositoryUrl = `https://github.com/${wikiRepository}`;

export function articleSlug(id: string) {
  return id.replace(/\.(md|mdx)$/, '');
}

export function categoryLabel(slug: string) {
  return wikiCategories.find((category) => category.slug === slug)?.label ?? slug;
}

export function statusLabel(status: string) {
  return status === 'outdated' ? 'Outdated' : 'Current';
}

export function sourcePath(id: string) {
  return `src/content/wiki/${id}`;
}
