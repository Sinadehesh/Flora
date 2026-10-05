// Writes the privacy policy's public web page (site/privacy/index.html, served by GitHub Pages and linked
// from the Play Store listing) and PRIVACY.md from src/data/privacyPolicy.ts. Node 22.18+ runs the .ts import.
import { mkdirSync, writeFileSync } from 'node:fs';

import { privacyHtml, privacyMarkdown } from '../src/data/privacyPolicy.ts';

mkdirSync(new URL('../site/privacy/', import.meta.url), { recursive: true });
writeFileSync(new URL('../site/privacy/index.html', import.meta.url), privacyHtml());
writeFileSync(new URL('../PRIVACY.md', import.meta.url), privacyMarkdown());
console.log('Wrote site/privacy/index.html and PRIVACY.md');
