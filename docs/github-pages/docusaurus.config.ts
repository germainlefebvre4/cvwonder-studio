import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CV Wonder Studio',
  tagline: 'Write your CV with Wonder!',
  favicon: 'img/favicon.ico',

  url: 'https://docs.studio.cvwonder.fr',
  baseUrl: '/',

  organizationName: 'germainlefebvre4',
  projectName: 'cvwonder-studio',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/germainlefebvre4/cvwonder-studio/tree/main/docs/github-pages/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      {name: 'keywords', content: 'cv, resume, generator, yaml, themes, professional'},
      {name: 'description', content: 'Generate beautiful, professional CVs from YAML in seconds with CV Wonder'},
      {name: 'og:type', content: 'website'},
      {name: 'og:title', content: 'CV Wonder | Professional CV Generator'},
      {name: 'og:description', content: 'Generate beautiful, professional CVs from YAML in seconds with CV Wonder'},
    ],
    navbar: {
      title: 'CV Wonder Studio',
      logo: {
        alt: 'CV Wonder',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs/user-guide',
          label: 'User Guide',
          position: 'left',
        },
        {
          to: '/docs/developer-guide',
          label: 'Developer Guide',
          position: 'left',
        },
        {
          href: 'https://github.com/germainlefebvre4/cvwonder-studio',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'User Guide',
          items: [
            {
              label: 'Playground',
              to: 'https://studio.cvwonder.fr',
            },
            {
              label: 'Export Options',
              to: '/docs/user-guide/export-options',
            },
            {
              label: 'Gallery',
              to: '/docs/user-guide/gallery',
            },
          ],
        },
        {
          title: 'Developer Guide',
          items: [
            {
              label: 'Installation',
              to: '/docs/developer-guide/installation',
            },
            {
              label: 'Contributing',
              to: '/docs/contributing',
            },
            {
              label: 'License',
              to: '/docs/license',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/germainlefebvre4/cvwonder-studio',
            },
            {
              label: 'Releases',
              href: 'https://github.com/germainlefebvre4/cvwonder-studio/releases',
            },
            {
              label: 'Report Issues',
              href: 'https://github.com/germainlefebvre4/cvwonder-studio/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Germain LEFEBVRE. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'go'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
