import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mode = process.argv.includes("--build") ? "build" : "test";
const failures = [];

function displayPath(file) {
  return relative(projectRoot, file).replaceAll("\\", "/") || ".";
}

function walk(directory, extensions, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".manus"].includes(entry.name)) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) walk(file, extensions, files);
    else if (extensions.has(extname(entry.name).toLowerCase())) files.push(file);
  }
  return files;
}

function fail(message) {
  failures.push(message);
}

const htmlFiles = walk(projectRoot, new Set([".html"]));
const cssFiles = walk(projectRoot, new Set([".css"]));
const jsFiles = walk(projectRoot, new Set([".js"]));

if (htmlFiles.length === 0) fail("No HTML pages were found.");

const knownCorruption = /<rtml|\brref=|<r[1-6][ >]|font-famiry|stylesreet|rigrt|rigrr/i;
const assetReference = /(?:href|src)=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["']/gi;
let localReferences = 0;

for (const htmlFile of htmlFiles) {
  const source = readFileSync(htmlFile, "utf8");
  if (knownCorruption.test(source)) {
    fail(`${displayPath(htmlFile)} contains a known h-to-r corruption signature.`);
  }

  for (const match of source.matchAll(assetReference)) {
    const reference = match[1].split("?")[0];
    if (/^(?:https?:|\/\/|data:|#)/i.test(reference)) continue;
    localReferences += 1;
    const asset = resolve(join(htmlFile, "..", reference));
    if (!existsSync(asset) || !statSync(asset).isFile()) {
      fail(`${displayPath(htmlFile)} references missing asset ${reference}.`);
    }
  }
}

for (const jsFile of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", jsFile], { stdio: "pipe" });
  } catch (error) {
    const output = Buffer.concat([error.stdout ?? Buffer.alloc(0), error.stderr ?? Buffer.alloc(0)])
      .toString()
      .trim()
      .replaceAll("\n", " ");
    fail(`${displayPath(jsFile)} failed JavaScript syntax validation${output ? `: ${output}` : "."}`);
  }
}

for (const cssFile of cssFiles) {
  const source = readFileSync(cssFile, "utf8");
  const openingBraces = (source.match(/\{/g) ?? []).length;
  const closingBraces = (source.match(/\}/g) ?? []).length;
  if (openingBraces !== closingBraces) {
    fail(`${displayPath(cssFile)} has unbalanced CSS braces (${openingBraces} opening, ${closingBraces} closing).`);
  }
}

console.log(`Static site ${mode} check: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${jsFiles.length} JavaScript files, ${localReferences} local asset references.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} validation failure${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Static site ${mode} check passed.`);
