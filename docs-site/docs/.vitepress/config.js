import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    base: "/simpesa/",
    title: "Sim-Pesa",
    description: "Local-first M-Pesa API Simulator",
    themeConfig: {
      nav: [
        { text: "Home", link: "/" },
        { text: "Quickstart", link: "/guide/quickstart" },
        { text: "Blogs", link: "https://hashnode.com/@paul-murithi" },
        { text: "API", link: "/api/" },
        { text: "Architecture", link: "/architecture/" },
      ],
      sidebar: [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/quickstart" },
            { text: "How M-Pesa Works", link: "/guide/how-mpesa-works.md" },
            {
              text: "Future Enhancements",
              link: "/guide/future-enhancements.md",
            },
          ],
        },
        {
          text: "Core Guides",
          items: [
            { text: "Core Concepts", link: "/guide/core-concepts.md" },
            {
              text: "Simulating Scenarios",
              link: "/guide/simulating-scenarios.md",
            },
            {
              text: "Transition to Daraja",
              link: "/guide/transition-to-daraja.md",
            },
          ],
        },
        {
          text: "Development",
          items: [
            { text: "Contributing Guide", link: "/guide/contributing" },
            { text: "Troubleshooting", link: "/guide/troubleshooting.md" },
            { text: "Architecture", link: "/architecture/" },
          ],
        },
        {
          text: "Reference",
          items: [{ text: "API Reference", link: "/api/" }],
        },
      ],
      socialLinks: [
        { icon: "github", link: "https://github.com/paul-murithi/simpesa" },
      ],
      footer: {
        message: "Released under the MIT License.",
        copyright: "Copyright © 2026 Sim-Pesa",
      },
    },
    mermaid: {
      // mermaidConfig: {
      //   theme: 'neutral',
      // }
    },
  }),
);
