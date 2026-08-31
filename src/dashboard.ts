export interface DashboardItem {
  icon?: string;
  name: string;
  url: string;
}

export interface DashboardCategory {
  items: DashboardItem[];
  name: string;
}

export interface Dashboard {
  categories: DashboardCategory[];
}

/** A quick link under the clock. Seeded from `dashboard.yml`, editable in Settings. */
export interface Shortcut {
  icon?: string;
  name: string;
  url: string;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(message);
  }

  return value as Record<string, unknown>;
}

function requiredText(value: unknown, message: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new TypeError(message);
  }

  return text;
}

function parseIcon(value: unknown, itemName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const icon = requiredText(value, `Item '${itemName}' has invalid 'icon'`);
  if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(icon)) {
    throw new TypeError(`Item '${itemName}' needs an icon like 'lucide:server', got '${icon}'`);
  }

  return icon;
}

function parseUrl(value: unknown, categoryName: string): string {
  const url = requiredText(value, `Each item in '${categoryName}' requires 'name' and 'url'`);
  const protocol = new URL(url).protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new TypeError(`Item URL in '${categoryName}' must use HTTP or HTTPS`);
  }

  return url;
}

export function parseDashboard(value: unknown): Dashboard {
  const source = asRecord(value, "Dashboard source must be a mapping");
  if (!Array.isArray(source.categories)) {
    throw new TypeError("Expected top-level 'categories' list in source YAML");
  }

  const categoryNames = new Set<string>();
  const itemUrls = new Set<string>();
  const categories = source.categories.map((rawCategory) => {
    const category = asRecord(rawCategory, "Each category must be a mapping");
    const name = requiredText(category.name, "Each category requires a non-empty 'name'");
    const normalizedName = name.toLocaleLowerCase();
    if (categoryNames.has(normalizedName)) {
      throw new TypeError(`Duplicate category name '${name}'`);
    }
    categoryNames.add(normalizedName);

    if (!Array.isArray(category.items)) {
      throw new TypeError(`Category '${name}' requires an 'items' list`);
    }

    const items = category.items.map((rawItem) => {
      const item = asRecord(rawItem, `Category '${name}' contains an invalid item`);
      const itemName = requiredText(item.name, `Each item in '${name}' requires 'name' and 'url'`);
      const url = parseUrl(item.url, name);
      if (itemUrls.has(url)) {
        throw new TypeError(`Duplicate item URL '${url}'`);
      }
      itemUrls.add(url);

      return { icon: parseIcon(item.icon, itemName), name: itemName, url };
    });

    return { items, name };
  });

  return { categories };
}

/** Flattens the YAML categories into the flat shortcut list the startpage renders. */
export function toShortcuts(dashboard: Dashboard): Shortcut[] {
  return dashboard.categories.flatMap((category) =>
    category.items.map((item) => ({ icon: item.icon, name: item.name, url: item.url })),
  );
}
