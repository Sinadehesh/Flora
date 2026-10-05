// Writes the privacy policy's public web page and PRIVACY.md from src/data/privacyPolicy.ts.
// The page is served by Vercel (project "floralock", root site/) at /privacy/ and, for
// https://www.sinadehesh.com/floralock/privacy/, at /floralock/privacy/. Node 22.18+ runs the .ts import.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

import { privacyHtml, privacyMarkdown } from '../src/data/privacyPolicy.ts';

const site = (path) => new URL(`../site/${path}`, import.meta.url);
for (const dir of ['privacy/', 'floralock/privacy/']) {
  mkdirSync(site(dir), { recursive: true });
  writeFileSync(site(`${dir}index.html`), privacyHtml());
}
copyFileSync(site('index.html'), site('floralock/index.html'));
copyFileSync(site('favicon.png'), site('floralock/favicon.png'));
writeFileSync(new URL('../PRIVACY.md', import.meta.url), privacyMarkdown());
console.log('Wrote site/privacy/, site/floralock/ and PRIVACY.md');
