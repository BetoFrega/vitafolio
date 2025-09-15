import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
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
