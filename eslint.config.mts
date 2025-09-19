import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
    ignores: [
      "dist/**/*",
      "node_modules/**/*",
      "**/*.min.js",
      "**/*.min.js.map",
      ".next/**/*",
    ],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: [
      "**/*.jsonc",
      ".vscode/*.json",
      ".vscode/*.jsonc",
      "*.code-workspace",
      ".devcontainer/*.json",
      ".devcontainer/*.jsonc",
    ],
    language: "json/jsonc",
    rules: {
      "json/no-duplicate-keys": "error",
    },
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },

  {
    files: ["**/*.md"],
    plugins: {
      // @ts-expect-error - Known issue with types https://github.com/eslint/markdown/issues/402
      markdown: markdown,
    },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
]);
