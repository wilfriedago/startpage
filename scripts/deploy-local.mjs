/**
 * Copies the built page to a stable path outside the project, so a browser can
 * be pointed at one URL that survives every rebuild — set it as your homepage
 * once, then `pnpm build && pnpm deploy:local` to update it in place.
 *
 * Pass a destination to override the default: `pnpm deploy:local ~/startpage.html`
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const source = fileURLToPath(new URL("../dist/index.html", import.meta.url));
const destination = resolve(process.argv[2] ?? "/tmp/startpage.html");

const built = await stat(source).catch(() => null);

if (!built) {
  console.error(`Nothing to deploy: ${source} is missing.`);
  console.error("Run `pnpm build` first.");
  process.exitCode = 1;
} else {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);

  console.log(`Deployed ${Math.round(built.size / 1024)} KiB to ${destination}`);
  console.log(`  ${pathToFileURL(destination).href}`);
}
