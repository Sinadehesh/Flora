#!/usr/bin/env node
// Downloads one openly licensed photo per plant from Wikimedia Commons into
// assets/plants/ and regenerates src/data/plantImages.generated.ts with credits.
//
//   npm run fetch-images                 # fetch missing images
//   npm run fetch-images -- --force      # re-download everything
//   npm run fetch-images -- --only rose,tulip
//
// The photo is the Wikipedia article's lead image unless scripts/image-overrides.json
// maps the plant id to a specific Commons file ("rose": "File:Rosa_rubiginosa_1.jpg").
// Only CC0 / public-domain / CC BY / CC BY-SA files are accepted. Review every
// photo before shipping: a lead image is occasionally a diagram or the wrong part.
// Requires Node >= 22.18 (imports the TypeScript plant list directly).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets/plants');
const manifestPath = join(root, 'scripts/plant-images.json');
const generatedPath = join(root, 'src/data/plantImages.generated.ts');
const overridesPath = join(root, 'scripts/image-overrides.json');

const { PLANTS } = await import(join(root, 'src/data/plants.ts'));

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args[args.indexOf('--only') + 1];
const only = args.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : null;

const HEADERS = { 'User-Agent': 'FloraLock/0.1 (plant image fetcher; https://github.com/sinadehesh/flora)' };
const ALLOWED_LICENSE = /^(cc0|public domain|pd\b|pdm|cc by(-sa)? \d(\.\d)?)/i;
const WIDTH = 1080;

const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${host} ${res.status}`);
  return res.json();
}

async function leadImageFile(title) {
  const data = await api('en.wikipedia.org', {
    action: 'query',
    prop: 'pageimages',
    piprop: 'name',
    titles: title,
    redirects: '1',
  });
  const name = data.query?.pages?.[0]?.pageimage;
  return name ? `File:${name}` : null;
}

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function commonsInfo(file) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(WIDTH),
    titles: file,
  });
  const info = data.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  return {
    url: info.thumburl ?? info.url,
    mime: info.mime,
    license: stripHtml(meta.LicenseShortName?.value) || 'unknown',
    author: stripHtml(meta.Artist?.value) || 'Unknown author',
    sourceUrl: info.descriptionurl,
  };
}

mkdirSync(outDir, { recursive: true });

for (const plant of PLANTS) {
  if (only && !only.has(plant.id)) continue;
  if (!force && manifest[plant.id] && existsSync(join(outDir, manifest[plant.id].file))) continue;
  try {
    const file = overrides[plant.id] ?? (await leadImageFile(plant.wikiTitle));
    if (!file) {
      console.warn(`✗ ${plant.id}: no lead image for "${plant.wikiTitle}"`);
      continue;
    }
    const info = await commonsInfo(file);
    if (!info) {
      console.warn(`✗ ${plant.id}: ${file} is not on Commons (likely non-free)`);
      continue;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime)) {
      console.warn(`✗ ${plant.id}: ${file} is ${info.mime}`);
      continue;
    }
    if (!ALLOWED_LICENSE.test(info.license)) {
      console.warn(`✗ ${plant.id}: license "${info.license}" not allowed`);
      continue;
    }

    const ext = info.mime === 'image/png' ? 'png' : info.mime === 'image/webp' ? 'webp' : 'jpg';
    const res = await fetch(info.url, { headers: HEADERS });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const outFile = `${plant.id}.${ext}`;
    writeFileSync(join(outDir, outFile), Buffer.from(await res.arrayBuffer()));
    manifest[plant.id] = {
      file: outFile,
      commonsFile: file,
      author: info.author,
      license: info.license,
      sourceUrl: info.sourceUrl,
    };
    console.log(`✓ ${plant.id}: ${file} (${info.license})`);
  } catch (err) {
    console.warn(`✗ ${plant.id}: ${err.message}`);
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n');

const entries = Object.entries(sorted)
  .filter(([, m]) => existsSync(join(outDir, m.file)))
  .map(([id, m]) => {
    const credit = JSON.stringify({ author: m.author, license: m.license, sourceUrl: m.sourceUrl });
    return `  ${JSON.stringify(id)}: { source: require('../../assets/plants/${m.file}'), credit: ${credit} },`;
  });

writeFileSync(
  generatedPath,
  `// Generated by scripts/fetch-plant-images.mjs — do not edit by hand.
// Run \`npm run fetch-images\` to download openly licensed photos into assets/plants/.
import type { PlantImage } from './plantImageTypes';

export const PLANT_IMAGES: Record<string, PlantImage> = {${entries.length ? `\n${entries.join('\n')}\n` : ''}};
`,
);
console.log(`\n${entries.length}/${PLANTS.length} plants have photos. Wrote ${generatedPath}`);
