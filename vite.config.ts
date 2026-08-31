import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { icons as cbi } from "@iconify-json/cbi";
import { icons as lucide } from "@iconify-json/lucide";
import { icons as materialSymbols } from "@iconify-json/material-symbols";
import { icons as simpleIcons } from "@iconify-json/simple-icons";
import { getIconData, iconToSVG } from "@iconify/utils";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { parse } from "yaml";

import { parseDashboard, toShortcuts } from "./src/dashboard.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const virtualModuleId = "virtual:dashboard";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const collections = {
  cbi,
  lucide,
  "material-symbols": materialSymbols,
  "simple-icons": simpleIcons,
};

function renderIcon(iconName: string): string {
  const separator = iconName.indexOf(":");
  const prefix = iconName.slice(0, separator) as keyof typeof collections;
  const name = iconName.slice(separator + 1);
  const collection = collections[prefix];
  if (separator < 1 || !name || !collection) {
    throw new Error(`Unsupported icon '${iconName}'`);
  }

  const icon = getIconData(collection, name);
  if (!icon) {
    throw new Error(`Unknown icon '${iconName}'`);
  }

  const rendered = iconToSVG(icon, { height: "1em", width: "1em" });
  const attributes = Object.entries(rendered.attributes)
    .map(([attribute, value]) => `${attribute}="${value}"`)
    .join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" ${attributes} aria-hidden="true" focusable="false">${rendered.body}</svg>`;
}

function dashboardDataPlugin(): Plugin {
  return {
    name: "dashboard-data",
    resolveId(id) {
      return id === virtualModuleId ? resolvedVirtualModuleId : undefined;
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) {
        return undefined;
      }

      const sourceUrl = new URL("./dashboard.yml", import.meta.url);
      this.addWatchFile(fileURLToPath(sourceUrl));
      const source = await readFile(sourceUrl, "utf8");
      const shortcuts = toShortcuts(parseDashboard(parse(source)));
      const iconNames = new Set(
        shortcuts.map((shortcut) => shortcut.icon).filter((icon) => icon !== undefined),
      );
      const icons = Object.fromEntries(
        [...iconNames].sort().map((iconName) => [iconName, renderIcon(iconName)]),
      );

      return [
        `export const defaultShortcuts = ${JSON.stringify(shortcuts)};`,
        `export const icons = ${JSON.stringify(icons)};`,
      ].join("\n");
    },
  };
}

export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    target: "es2022",
  },
  plugins: [dashboardDataPlugin(), react(), viteSingleFile()],
  root: projectRoot,
});
