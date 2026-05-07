import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: 'Sim-Pesa',
    description: 'Local-first M-Pesa STK Push simulator. Run the full Daraja payment flow on localhost with Docker.',
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guide/quickstart' },
        { text: 'Architecture', link: '/guide/architecture' },
        { text: 'API Reference', link: '/api/index' },
        { text: 'GitHub', link: 'https://github.com/paul-murithi/simpesa' }
      ],
      sidebar: [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quickstart', link: '/guide/quickstart' },
            { text: 'How it works', link: '/guide/architecture' },
          ]
        },
        {
          text: 'Testing & Simulation',
          items: [
            { text: 'Error simulation', link: '/guide/error-simulation' },
            { text: 'Simulating scenarios', link: '/guide/simulating-scenarios' },
          ]
        },
        {
          text: 'Guides',
          items: [
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'How M-Pesa works', link: '/guide/how-mpesa-works' },
            { text: 'Transition to Daraja', link: '/guide/transition-to-daraja' },
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'API Reference', link: '/api/index' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ]
        },
        {
          text: 'Community',
          items: [
            { text: 'Contributing', link: '/guide/contributing' },
            { text: 'Future enhancements', link: '/guide/future-enhancements' },
          ]
        }
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/paul-murithi/simpesa' }
      ],
      footer: {
        message: "Released under the MIT License.",
        copyright: "Copyright (c) 2026 Sim-Pesa",
      },
    },
    mermaid: {
      // mermaidConfig: {
      //   theme: 'neutral',
      // }
    },
  }),
);
