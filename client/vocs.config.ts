import { defineConfig } from 'vocs'

export default defineConfig({
  description: 'Guides to help you learn build!',
  title: "JUS'Study Guides",
  basePath: '/docs',
  checkDeadlinks: true,
  aiCta: false,
  sidebar: [
    {
      text: 'Getting Started',
      link: '/',
    },
    {
      text: 'Shipping',
      collapsed: false,
      items: [
        {
          text: 'Shipping',
          link: '/shipping/shipping',
        },
        {
          text: 'Sourcing Parts',
          link: '/shipping/sourcing-parts',
        },
        {
          text: 'Reviews',
          link: '/shipping/reviews',
        },
      ],
    },
    {
      text: 'Guides',
      collapsed: false,
      items: [
        {
          text: 'Make a Stationery Organiser',
          link: '/guides/stationary-organiser',
        },
        {
          text: 'Make a Website Blocker',
          link: '/guides/website-blocker',
        },
      ],
    },
    {
      text: 'Help',
      collapsed: false,
      items: [
        {
          text: 'Resources',
          link: '/help/resources',
        },
        {
          text: 'FAQ',
          link: '/help/faq',
        },
        {
          text: 'Shop',
          link: '/help/shop',
        },
      ],
    },
    {
      text: 'API',
      link: '/api',
    },
  ],
})
