/**
 * The privacy policy, shown in the app (Settings > Privacy policy) and published as
 * PRIVACY.md for the Play Store listing. After editing, run `npm run privacy` to
 * regenerate PRIVACY.md; a test fails if the two drift apart.
 */
export interface PolicySection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const PRIVACY_POLICY = {
  title: 'FloraLock privacy policy',
  updated: '1 October 2026',
  url: 'https://github.com/Sinadehesh/Flora/blob/HEAD/PRIVACY.md',
  summary:
    'FloraLock has no accounts, no ads and no analytics, and it sends nothing off your phone. Everything it ' +
    'knows about you stays on your device.',
  sections: [
    {
      heading: 'What FloraLock uses on your phone',
      paragraphs: ['To lock the apps you choose, the Android app asks for these permissions:'],
      bullets: [
        'Usage access: to see which app is on screen, so it can show a plant question in front of an app you ' +
          'locked. It only checks the app in front right now; it keeps no history of the apps you use.',
        'List of installed apps: so you can pick which apps to lock. Only app names are read.',
        'Display over other apps: to show the plant question on top of a locked app.',
        'Notifications: Android requires a visible notification while the lock runs in the background.',
        'Run at start-up and ignore battery optimisation: so the lock keeps working after a restart and is not ' +
          'switched off by battery saving.',
      ],
    },
    {
      heading: 'What is stored, and where',
      paragraphs: [
        'FloraLock stores your settings, the apps you chose to lock, short unlock windows, and your learning ' +
          'progress (which plants you have learned and how many answers were right). All of it is kept only in ' +
          'FloraLock’s private storage on your phone.',
        'You can erase your learning progress in Settings > Reset learning progress. Uninstalling FloraLock or ' +
          'clearing its data in Android settings erases everything.',
      ],
    },
    {
      heading: 'What is shared',
      paragraphs: [
        'Nothing. FloraLock does not collect personal data, does not send data to us or to anyone else, and has ' +
          'no third-party tracking or advertising code. The plant photos are built into the app, so it does not ' +
          'need the internet.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: ['FloraLock does not collect personal information from anyone, including children under 13.'],
    },
    {
      heading: 'Plant photos',
      paragraphs: [
        'The plant photos come from iNaturalist observers and are used under CC0, CC BY and CC BY-SA licences. ' +
          'Credits are in the app under Settings > Photo credits.',
      ],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'If this policy changes, the new version will be published at this page with a new date.',
        'Questions: use the contact email on FloraLock’s Google Play listing, or open an issue at ' +
          'https://github.com/Sinadehesh/Flora/issues.',
      ],
    },
  ] satisfies PolicySection[],
};

/** PRIVACY.md, generated from the policy above. */
export function privacyMarkdown(policy = PRIVACY_POLICY): string {
  const lines = [`# ${policy.title}`, '', `_Last updated: ${policy.updated}_`, '', policy.summary, ''];
  for (const s of policy.sections as PolicySection[]) {
    lines.push(`## ${s.heading}`, '');
    for (const p of s.paragraphs) lines.push(p, '');
    if (s.bullets) lines.push(...s.bullets.map((b) => `- ${b}`), '');
  }
  return lines.join('\n');
}
