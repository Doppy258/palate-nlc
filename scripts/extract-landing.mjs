import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath =
  [path.join(root, "index.html"), path.join(root, ".index.html.bak")].find(
    (candidate) => fs.existsSync(candidate),
  ) ?? null;

if (!sourcePath) {
  console.error(
    "No landing HTML found. Add index.html or .index.html.bak to the project root.",
  );
  process.exit(1);
}

const html = fs.readFileSync(sourcePath, "utf8");
const outDir = path.join(root, "components", "landing");
fs.mkdirSync(outDir, { recursive: true });

const styles = [...html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)]
  .map((match) => match[2])
  .filter(Boolean)
  .join("\n\n");

fs.writeFileSync(path.join(outDir, "framer.css"), styles);

const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
const scriptStart = body.indexOf("<script");
const bodyContent =
  scriptStart > 0 ? body.slice(0, scriptStart).trim() : body.trim();

fs.writeFileSync(
  path.join(outDir, "landing-body.ts"),
  `export const landingBodyHtml = ${JSON.stringify(bodyContent)};\n`,
);

const scriptsPart = scriptStart > 0 ? body.slice(scriptStart) : "";
const scriptMatches = [
  ...scriptsPart.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g),
];

const inlineScripts = scriptMatches.map((match) => {
  const attrs = match[1];
  const get = (name) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;

  return {
    src: get("src"),
    type: get("type"),
    id: get("id"),
    content: match[2] || null,
    dataFramerAppearAnimation: attrs.includes("data-framer-appear-animation")
      ? "reduce"
      : null,
  };
});

const modulePreloads = [
  ...html.matchAll(/<link rel="modulepreload"[^>]+href="([^"]+)"/g),
].map((match) => match[1]);

fs.writeFileSync(
  path.join(outDir, "framer-scripts.ts"),
  `export const framerModulePreloads = ${JSON.stringify(modulePreloads, null, 2)} as const;\n\nexport const framerInlineScripts = ${JSON.stringify(inlineScripts, null, 2)} as const;\n`,
);

const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "Palate";
const description = html.match(/name="description" content="([^"]+)"/)?.[1] ?? "";
const ogImage =
  html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
const faviconLight =
  html.match(
    /rel="icon" media="\(prefers-color-scheme: light\)"[^>]+href="([^"]+)"/,
  )?.[1] ?? "";
const faviconDark =
  html.match(
    /rel="icon" media="\(prefers-color-scheme: dark\)"[^>]+href="([^"]+)"/,
  )?.[1] ?? "";
const appleTouchIcon =
  html.match(/rel="apple-touch-icon" href="([^"]+)"/)?.[1] ?? "";

fs.writeFileSync(
  path.join(outDir, "metadata.ts"),
  `export const landingMetadata = ${JSON.stringify({ title, description, ogImage, faviconLight, faviconDark, appleTouchIcon }, null, 2)} as const;\n`,
);

console.log(`Extracted landing page from ${path.basename(sourcePath)}`);
