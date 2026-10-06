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
// The FloraLock landing page also serves the site root (floralock.sinadehesh.com/); its canonical URL is /floralock/.
copyFileSync(site('floralock/index.html'), site('index.html'));
writeFileSync(new URL('../PRIVACY.md', import.meta.url), privacyMarkdown());
console.log('Wrote site/privacy/, site/floralock/privacy/, site/index.html and PRIVACY.md');
