import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { parseDashboard, toShortcuts } from "./dashboard";

const sourcePath = fileURLToPath(new URL("../dashboard.yml", import.meta.url));
const dashboard = parseDashboard(parse(readFileSync(sourcePath, "utf8")));

describe("dashboard data", () => {
  it("normalizes the source YAML", () => {
    expect(dashboard.categories).toHaveLength(4);
    expect(dashboard.categories.flatMap((category) => category.items)).toHaveLength(19);
  });

  it("flattens categories into shortcuts, preserving order and icons", () => {
    const shortcuts = toShortcuts(dashboard);
    expect(shortcuts).toHaveLength(19);
    expect(shortcuts[0]).toEqual({
      icon: "simple-icons:homeassistant",
      name: "Home Assistant",
      url: "https://www.home-assistant.io/",
    });
    expect(new Set(shortcuts.map((shortcut) => shortcut.url)).size).toBe(19);
  });

  it("rejects duplicate URLs", () => {
    expect(() =>
      parseDashboard({
        categories: [
          {
            name: "Duplicate",
            items: [
              { name: "One", url: "https://example.com" },
              { name: "Two", url: "https://example.com" },
            ],
          },
        ],
      }),
    ).toThrow("Duplicate item URL");
  });

  it("rejects non-HTTP URLs and malformed icons", () => {
    expect(() =>
      parseDashboard({
        categories: [{ name: "Bad", items: [{ name: "One", url: "ftp://example.com" }] }],
      }),
    ).toThrow("must use HTTP or HTTPS");

    expect(() =>
      parseDashboard({
        categories: [
          { name: "Bad", items: [{ name: "One", url: "https://example.com", icon: "server" }] },
        ],
      }),
    ).toThrow("needs an icon like");
  });
});
