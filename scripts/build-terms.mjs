// Writes the Terms of Service pages for the apps:
//   site/floralock/terms/index.html   https://www.sinadehesh.com/floralock/terms/
//   site/shroomlock/terms/index.html  https://www.sinadehesh.com/shroomlock/terms/
//   site/cloudlock/terms/index.html   https://www.sinadehesh.com/cloudlock/terms/
// One text, with each app's own details and colours. Run `npm run terms` after editing.
import { mkdirSync, writeFileSync } from 'node:fs';

const UPDATED = '6 October 2026';

const apps = {
  floralock: {
    name: 'FloraLock',
    pkg: 'com.floralock.app',
    things: 'plants',
    thing: 'plant',
    plus: 'FloraLock Plus',
    photos: 'iNaturalist observers and are used under CC0, CC BY and CC BY-SA licences',
    harm: 'eating, using or handling a plant, or from relying on the app’s identification, edibility or toxicity information',
    repo: 'https://github.com/Sinadehesh/Flora/issues',
    safety:
      'FloraLock teaches you to recognise plants. Its information about edibility, toxicity, uses and folklore is general background only, not medical, foraging or veterinary advice. Never eat a plant, use it as medicine or give it to an animal because of the app. Many plants have toxic look-alikes, and many garden plants and houseplants are harmful to children and pets.',
    colors: { bg: '#F6F4EE', text: '#1C2A21', muted: '#5E6B61', accent: '#2F5D43', card: '#FFFFFF', border: '#DCE1D5' },
    dark: { bg: '#101612', text: '#E8EDE6', muted: '#9AA79D', accent: '#8CC9A0', card: '#18211B', border: '#2C3930' },
    font: '"Fraunces", Georgia, serif',
  },
  shroomlock: {
    name: 'ShroomLock',
    pkg: 'com.shroomlock.app',
    things: 'mushrooms',
    thing: 'mushroom',
    plus: 'ShroomLock Plus',
    photos: 'iNaturalist observers and are used under CC0, CC BY and CC BY-SA licences',
    harm: 'eating, using or handling a mushroom, or from relying on the app’s identification, edibility or toxicity information',
    repo: 'https://github.com/Sinadehesh/mushroom/issues',
    safety:
      'ShroomLock teaches you to recognise mushrooms; it does not teach foraging. Never eat a wild mushroom, or give one to anyone, because of the app, a photo, a clue or an edibility label. Photos cannot show smell, spore print or what grows underground, and some deadly mushrooms look like edible ones. Have every find checked in person by a qualified expert. Mushroom poisoning can be fatal.',
    colors: { bg: '#F6F1EA', text: '#2A211B', muted: '#6E6259', accent: '#8A4B2A', card: '#FFFFFF', border: '#E2D8CB' },
    dark: { bg: '#15110E', text: '#EFE7DF', muted: '#A8998C', accent: '#E0A27A', card: '#1F1915', border: '#382E27' },
    font: '"Alegreya", Georgia, serif',
  },
  cloudlock: {
    name: 'CloudLock',
    pkg: 'com.cloudlock.app',
    things: 'clouds',
    thing: 'cloud',
    plus: 'CloudLock Plus',
    photos:
      'Flickr photographers (found through Openverse) and are used under CC0, the Public Domain Mark, CC BY and CC BY-SA',
    harm: 'weather, or from relying on the app’s identification or weather information',
    repo: 'https://github.com/Sinadehesh/cloudes/issues',
    safety:
      'CloudLock teaches you to recognise clouds and what weather they usually bring. It is not a weather forecast or a warning service. In stormy weather, follow your local weather service and emergency instructions and take shelter; never stay outside to watch or photograph a funnel, wall or shelf cloud because of the app.',
    colors: { bg: '#EEF4FA', text: '#17293D', muted: '#5B6B7D', accent: '#2F6FA8', card: '#FFFFFF', border: '#D3DEEA' },
    dark: { bg: '#0E1621', text: '#E6EEF7', muted: '#96A6B8', accent: '#8EC1F0', card: '#16212F', border: '#2A3949' },
    font: '"Nunito", system-ui, sans-serif',
  },
};

const sections = (a) => [
  [
    'Agreement',
    [
      `These terms cover the ${a.name} app for Android (package ${a.pkg}) and its website. By installing or using ${a.name} you agree to them. If you don’t agree, please don’t use the app. “We” means ${a.name}’s developer, the developer named on ${a.name}’s Google Play page.`,
    ],
  ],
  [
    'What the app does',
    [
      `${a.name} locks the apps you choose. When you open one, it asks you to identify a ${a.thing} from a photo; a right answer, an emergency unlock or the “I don’t need this right now” button decides what happens next. You choose the apps, the settings and when to turn the lock off.`,
      `The lock depends on Android permissions you grant (usage access and display over other apps) and on your phone letting it run. Some phones stop background apps, and you can always turn the lock off, uninstall the app or use an emergency unlock, so ${a.name} is a habit tool, not a guarantee that an app stays blocked. Don’t rely on it to block anything you must not access, or for parental control.`,
    ],
  ],
  ['Safety: learning, not advice', [a.safety]],
  [
    'Your licence to use the app',
    [
      `We give you a personal, non-exclusive, non-transferable licence to use ${a.name} on devices you own or control, for your own non-commercial use. Please don’t copy, resell, or redistribute the app or its content, interfere with how it works, or use it to break the law.`,
    ],
  ],
  [
    `${a.plus} and payments`,
    [
      `${a.name} is free to download. ${a.plus} is an optional one-time purchase made through Google Play, which processes the payment under Google’s terms. Plus is tied to your Google account and stays unlocked on any phone signed in to it.`,
      `Refunds follow Google Play’s refund policy; you can request one through Google Play. If a purchase is refunded or reversed, Plus is removed and the extra locked apps are released. Prices are shown in Google Play before you buy, including any taxes Google collects.`,
    ],
  ],
  [
    'Photos and content',
    [
      `The ${a.thing} photos come from ${a.photos}; each photographer is credited in the app under Settings > Photo credits and in the store images. Those licences, not these terms, govern the photos. The rest of the app’s text, design and code belong to us.`,
      `We work to keep names, facts and clues accurate, but nature is variable and mistakes happen. If you spot one, please tell us.`,
    ],
  ],
  [
    'Privacy',
    [
      `${a.name} keeps your data on your phone and sends nothing to us. The privacy policy at https://www.sinadehesh.com/${a.name.toLowerCase()}/privacy/ explains what the app stores and why.`,
    ],
  ],
  [
    'No warranty',
    [
      `${a.name} is provided “as is” and “as available”. To the extent the law allows, we make no promises that it will be error-free, always available, or suitable for a particular purpose, or that its content is complete or accurate.`,
    ],
  ],
  [
    'Limitation of liability',
    [
      `To the extent the law allows, we are not liable for indirect or consequential losses, or for any harm that comes from ${a.harm}. Our total liability for anything related to ${a.name} is limited to the amount you paid for ${a.plus}, if anything. Nothing in these terms limits rights you have as a consumer that the law says cannot be limited.`,
    ],
  ],
  [
    'Ending these terms',
    [
      'You can stop at any time by uninstalling the app. We may stop offering the app or a feature. If you break these terms, your licence ends.',
    ],
  ],
  [
    'Changes and contact',
    [
      'If these terms change, the new version will be published on this page with a new date. Continuing to use the app after a change means you accept the new terms.',
      `Questions: use the contact email on ${a.name}’s Google Play listing, or open an issue at ${a.repo}.`,
    ],
  ],
];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rich = (t) => esc(t).replace(/https:\/\/[^\s)]+[^\s).,]/g, (u) => `<a href="${u}">${u}</a>`);

function page(slug, a) {
  const url = `https://www.sinadehesh.com/${slug}/terms/`;
  const body = sections(a)
    .map(([h, ps]) => `<h2>${esc(h)}</h2>\n${ps.map((p) => `<p>${rich(p)}</p>`).join('\n')}`)
    .join('\n');
  const c = a.colors;
  const d = a.dark;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${a.name} Terms of Service</title>
<meta name="description" content="The terms for using ${a.name}, the Android app locker that teaches you ${a.things}: the app lock, safety, ${a.plus} purchases, content and liability.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/${slug}/favicon.png">
<style>
:root { --bg: ${c.bg}; --text: ${c.text}; --muted: ${c.muted}; --accent: ${c.accent}; --card: ${c.card}; --border: ${c.border}; }
@media (prefers-color-scheme: dark) {
  :root { --bg: ${d.bg}; --text: ${d.text}; --muted: ${d.muted}; --accent: ${d.accent}; --card: ${d.card}; --border: ${d.border}; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
nav { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 0.95rem; margin-bottom: 28px; }
nav a { color: var(--muted); }
h1 { font-family: ${a.font}; font-size: 2rem; line-height: 1.2; margin: 0 0 4px; }
h2 { font-size: 1.15rem; margin: 30px 0 8px; }
.updated { color: var(--muted); margin: 0 0 24px; }
.summary { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px 20px; font-weight: 600; }
a { color: var(--accent); overflow-wrap: anywhere; }
</style>
</head>
<body>
<main>
<nav><a href="/${slug}/">← ${a.name}</a><a href="/${slug}/privacy/">Privacy policy</a><a href="/app-lockers/">All app lockers</a></nav>
<h1>${a.name} Terms of Service</h1>
<p class="updated">Last updated: ${UPDATED}</p>
<p class="summary">${esc(`In short: use ${a.name} to build better phone habits and learn ${a.things}. It is a learning tool, not safety advice, and not a guaranteed blocker. Plus is a one-time Google Play purchase. Your data stays on your phone.`)}</p>
${body}
</main>
</body>
</html>
`;
}

for (const [slug, a] of Object.entries(apps)) {
  const dir = new URL(`../site/${slug}/terms/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page(slug, a));
}
console.log(
  `Wrote ${Object.keys(apps)
    .map((slug) => `site/${slug}/terms/`)
    .join(', ')}`,
);
