#!/usr/bin/env node
// Renders every app icon asset from assets/icon-symbol.svg.
//
//   npm run icons
//
// Sizes follow Expo's guidance: 1024×1024 PNGs; the Android adaptive foreground
// and monochrome layers keep the symbol inside the central safe zone, because
// launchers crop the outer third to a circle, squircle, etc.

import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const symbol = readFileSync(join(root, 'assets/icon-symbol.svg'), 'utf8');

const GREEN = '#2F5D43';
const PINK = '#DC6A7C';
const CREAM = '#F6F4EE';
const SYMBOL_HEIGHT = 1240; // viewBox height of icon-symbol.svg

const recolor = (green, pink) => symbol.replaceAll(GREEN, green).replaceAll(PINK, pink);
const monochrome = recolor('#FFFFFF', '#FFFFFF');
// iOS dark mode: the system draws a dark backdrop, so lighten the colours (the app's dark theme).
const dark = recolor('#8CC9A0', '#E58A9B');
// iOS tinted mode: a grayscale image the system tints; keep the tulip a step darker than the lock.
const tinted = recolor('#F2F2F2', '#A6A6A6');

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function renderSymbol(svg, height) {
  const art = await sharp(Buffer.from(svg), { density: (72 * height) / SYMBOL_HEIGHT })
    .resize({ height })
    .png()
    .toBuffer();
  return { art, width: (await sharp(art).metadata()).width };
}

/** Symbol rendered `height` px tall, centred on a square canvas (transparent unless `background`). */
async function compose(svg, size, height, background = TRANSPARENT) {
  const { art, width } = await renderSymbol(svg, height);
  return sharp({ create: { width: size, height: size, channels: 4, background } }).composite([
    { input: art, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) },
  ]);
}

/** Opaque copy (App Store icons must not have an alpha channel). */
const opaque = async (image) => sharp(await image.png().toBuffer()).removeAlpha();

/** Play Store feature graphic (1024×500): symbol on the left, name and tagline on the right. */
async function featureGraphic() {
  const { art } = await renderSymbol(symbol, 340);
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
    <text x="400" y="235" font-family="Georgia, 'DejaVu Serif', serif" font-weight="bold" font-size="92" fill="${GREEN}">FloraLock</text>
    <text x="404" y="300" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif" font-size="32" fill="#5E6B61">Name the flower. Unlock your app.</text>
  </svg>`);
  return sharp({ create: { width: 1024, height: 500, channels: 3, background: CREAM } }).composite([
    { input: art, left: 110, top: 80 },
    { input: text, left: 0, top: 0 },
  ]);
}

const outputs = [
  // iOS light / default: opaque, symbol at the same proportions as the original artwork.
  ['assets/icon.png', () => compose(symbol, 1024, 650, CREAM).then(opaque)],
  // iOS 18+ appearances. Apple asks for a transparent background on the dark icon
  // and an opaque grayscale image for the tinted one.
  ['assets/ios-icon-dark.png', () => compose(dark, 1024, 650)],
  ['assets/ios-icon-tinted.png', () => compose(tinted, 1024, 650, '#000000').then(opaque)],
  // Android adaptive icon: ~52% tall keeps the whole symbol inside the circular mask.
  ['assets/android-icon-foreground.png', () => compose(symbol, 1024, 530)],
  ['assets/android-icon-monochrome.png', () => compose(monochrome, 1024, 530)],
  [
    'assets/android-icon-background.png',
    () => sharp({ create: { width: 1024, height: 1024, channels: 3, background: CREAM } }),
  ],
  // Splash: shown at a fixed width by expo-splash-screen, so fill the canvas.
  ['assets/splash-icon.png', () => compose(symbol, 1024, 980)],
  ['assets/favicon.png', () => compose(symbol, 48, 40, CREAM).then(opaque)],
  // Store listings (not bundled in the app).
  ['store/play-icon-512.png', () => compose(symbol, 512, 325, CREAM).then(opaque)],
  ['store/play-feature-graphic.png', () => featureGraphic().then(opaque)],
];

mkdirSync(join(root, 'store'), { recursive: true });
for (const [file, make] of outputs) {
  const image = await make();
  await image.png({ compressionLevel: 9 }).toFile(join(root, file));
  console.log(`✓ ${file}`);
}
