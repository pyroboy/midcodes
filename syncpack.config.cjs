module.exports = {
  source: ["apps/*/package.json", "packages/*/package.json", "package.json"],
  semverRange: "workspace:^",
  versionGroups: [
    {
      label: "SvelteKit core aligned",
      packages: ["apps/*"],
      dependencies: ["svelte", "@sveltejs/kit", "@sveltejs/vite-plugin-svelte", "vite"]
    },
    {
      label: "Tailwind ecosystem",
      packages: ["apps/*"],
      dependencies: ["tailwindcss", "@tailwindcss/forms", "@tailwindcss/typography", "@tailwindcss/aspect-ratio", "tailwindcss-animate"]
    }
  ]
};
