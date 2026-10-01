// Writes PRIVACY.md (the Play Store privacy policy URL) from src/data/privacyPolicy.ts.
// Node 22.18+ runs the .ts import directly.
import { writeFileSync } from 'node:fs';

import { privacyMarkdown } from '../src/data/privacyPolicy.ts';

writeFileSync(new URL('../PRIVACY.md', import.meta.url), privacyMarkdown());
console.log('Wrote PRIVACY.md');
