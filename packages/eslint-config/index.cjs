module.exports = {
  root: false,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  extends: ["eslint:recommended", "plugin:svelte/recommended", "prettier"],
  overrides: [{ files: ["*.svelte"], parser: "svelte-eslint-parser" }],
  rules: {}
};
