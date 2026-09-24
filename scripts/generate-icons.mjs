#!/usr/bin/env node
// Renders every app icon asset from assets/icon-symbol.svg.
//
//   npm run icons
//
// Sizes follow Expo's guidance: 1024×1024 PNGs; the Android adaptive foreground
// and monochrome layers keep the symbol inside the central safe zone, because
// launchers crop the outer third to a circle, squircle, etc.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const assets = join(dirname(fileURLToPath(import.meta.url)), '../assets');
const symbol = readFileSync(join(assets, 'icon-symbol.svg'), 'utf8');
const monochrome = symbol.replaceAll('#2F5D43', '#FFFFFF').replaceAll('#DC6A7C', '#FFFFFF');

const CREAM = '#F6F4EE';
const SYMBOL_HEIGHT = 1240; // viewBox height of icon-symbol.svg

/** Symbol rendered `height` px tall, centred on a transparent or solid square canvas. */
async function compose(svg, size, height, background) {
  const art = await sharp(Buffer.from(svg), { density: (72 * height) / SYMBOL_HEIGHT })
    .resize({ height })
    .png()
    .toBuffer();
  const { width } = await sharp(art).metadata();
  return sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: art, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }]);
}

/** Opaque copy (App Store icons must not have an alpha channel). */
const opaque = async (image) => sharp(await image.png().toBuffer()).removeAlpha();

const outputs = [
  // iOS / fallback: opaque, symbol at the same proportions as the original artwork.
  ['icon.png', () => compose(symbol, 1024, 650, CREAM).then(opaque)],
  // Android adaptive icon: ~52% tall keeps the whole symbol inside the circular mask.
  ['android-icon-foreground.png', () => compose(symbol, 1024, 530)],
  ['android-icon-monochrome.png', () => compose(monochrome, 1024, 530)],
  [
    'android-icon-background.png',
    () => sharp({ create: { width: 1024, height: 1024, channels: 3, background: CREAM } }),
  ],
  // Splash: shown at a fixed width by expo-splash-screen, so fill the canvas.
  ['splash-icon.png', () => compose(symbol, 1024, 980)],
  ['favicon.png', () => compose(symbol, 48, 40, CREAM).then(opaque)],
];

for (const [file, make] of outputs) {
  const image = await make();
  await image.png({ compressionLevel: 9 }).toFile(join(assets, file));
  console.log(`✓ assets/${file}`);
}
