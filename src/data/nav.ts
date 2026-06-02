export interface NavItem {
  label: string;
  slug: string;
}

export interface NavGroup {
  label: string;
  collapsed?: boolean;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

export const docsNav: NavEntry[] = [
  { label: 'Introduction', slug: 'intro' },
  { label: 'Requirements', slug: 'requirements' },
  { label: 'Downloading Fallen World', slug: 'setup' },
  { label: 'Launching the Game', slug: 'launching' },
  {
    label: 'Gameplay Guide',
    collapsed: true,
    items: [
      { label: 'Overview', slug: 'gameplay' },
      { label: 'Survival', slug: 'gameplay/survival' },
      { label: 'Combat', slug: 'gameplay/combat' },
      { label: 'Controls', slug: 'gameplay/controls' },
      { label: 'Tips', slug: 'gameplay/tips' },
    ],
  },
  {
    label: 'FAQ & Troubleshooting',
    collapsed: true,
    items: [
      { label: 'FAQ Overview', slug: 'faq' },
      { label: 'General Questions', slug: 'faq/general' },
      { label: 'Technical', slug: 'faq/technical' },
      { label: 'Audio', slug: 'faq/audio' },
      { label: 'Installation', slug: 'faq/installation' },
      { label: 'Known Issues', slug: 'faq/known-issues' },
    ],
  },
  { label: 'Donations', slug: 'donations' },
];
