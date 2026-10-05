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

/**
 * Play Store feature graphic (1024×500): logo, name and tagline on the left, and a lock-screen
 * quiz card on the right with a real plant photo. The photo must be CC0 (no credit needed in
 * store art): lotus #2, see scripts/plant-photos.json.
 */
async function featureGraphic() {
  const W = 1024;
  const H = 500;
  const card = { x: 628, y: 38, w: 326, h: 424 };
  const photo = { x: card.x + 18, y: card.y + 52, w: card.w - 36, h: 200 };
  const chip = (x, y, label, right) => `
    <rect x="${x}" y="${y}" width="137" height="42" rx="12" fill="#FFFFFF" stroke="${right ? '#2E7D4F' : '#DCE1D5'}" stroke-width="${right ? 3 : 1.5}" />
    <text x="${x + 68.5}" y="${y + 27}" text-anchor="middle" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif" font-size="17" font-weight="bold" fill="${right ? '#2E7D4F' : '#1C2A21'}">${label}</text>`;
  const cx = card.x + 18;
  const cy = photo.y + photo.h + 50;
  const scene = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2F5D43" />
        <stop offset="1" stop-color="#1A3526" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.35" />
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)" />
    <text x="70" y="262" font-family="Georgia, 'DejaVu Serif', serif" font-weight="bold" font-size="74" fill="${CREAM}">FloraLock</text>
    <text x="72" y="318" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif" font-size="31" fill="${CREAM}">Name the plant. Unlock your app.</text>
    <text x="72" y="362" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif" font-size="21" fill="#A8CDB4">Learn a few new plants every day</text>
    <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="28" fill="${CREAM}" filter="url(#shadow)" />
    <text x="${cx}" y="${card.y + 34}" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif" font-size="13" font-weight="bold" letter-spacing="1.5" fill="#5E6B61">YOUR APP IS LOCKED</text>
    <text x="${cx}" y="${cy - 14}" font-family="Georgia, 'DejaVu Serif', serif" font-size="23" font-weight="bold" fill="#1C2A21">What is this plant?</text>
    ${chip(cx, cy, 'Peony', false)}${chip(cx + 153, cy, 'Lotus ✓', true)}
    ${chip(cx, cy + 52, 'Magnolia', false)}${chip(cx + 153, cy + 52, 'Dahlia', false)}
  </svg>`);
  const roundMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${photo.w}" height="${photo.h}"><rect width="${photo.w}" height="${photo.h}" rx="18" /></svg>`,
  );
  const plant = await sharp(join(root, 'assets/plants/lotus-2.jpg'))
    .resize(photo.w, photo.h, { fit: 'cover', position: 'attention' })
    .composite([{ input: roundMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const { art } = await renderSymbol(recolor(CREAM, '#E58A9B'), 150);
  return sharp({ create: { width: W, height: H, channels: 3, background: CREAM } }).composite([
    { input: scene, left: 0, top: 0 },
    { input: plant, left: photo.x, top: photo.y },
    { input: art, left: 72, top: 36 },
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
