// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'minecraft-llm-agent-community',
  tagline: 'Headless Minecraft agent-loop runtime research.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://naem1023.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/minecraft-llm-agent-community/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'naem1023', // Usually your GitHub org/user name.
  projectName: 'minecraft-llm-agent-community', // Usually your repo name.
  deploymentBranch: 'main',

  onBrokenLinks: 'throw',
  markdown: {
    format: 'mdx',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'blog-doc',
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/naem1023/minecraft-llm-agent-community/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/naem1023/minecraft-llm-agent-community/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social-card.jpeg',
      navbar: {
        title: 'minecraft-llm-agent-community',
        logo: {
          alt: 'minecraft-llm-agent-community logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'blogDocSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/naem1023/minecraft-llm-agent-community',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Overview',
                to: '/docs/intro',
              },
              {
                label: 'Architecture Spec',
                to: '/docs/Architecture/SPEC',
              },
              {
                label: 'Headless Server',
                to: '/docs/Setup/Headless-Server',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/naem1023/minecraft-llm-agent-community',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} minecraft-llm-agent-community. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
