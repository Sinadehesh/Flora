import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { lookalikesOf } from '../core/quiz';
import type { Clues, Plant } from '../core/types';
import { PLANT_CLUES } from '../data/plantClues';
import { PLANTS } from '../data/plants';
import { useColors } from '../theme';
import { EdibilityBadge } from './EdibilityBadge';
import { PlantPhoto } from './PlantPhoto';

const CLUE_ROWS: [Exclude<keyof Clues, 'key'>, string][] = [
  ['flower', 'Flower'],
  ['leaves', 'Leaves'],
  ['season', 'When'],
];

/** How to recognise it: the one feature that sets it apart, then the field clues. */
export function CluesList({ plant }: { plant: Plant }) {
  const c = useColors();
  const clues = PLANT_CLUES[plant.id];
  if (!clues) return null;
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.key, { backgroundColor: c.surfaceMuted }]}>
        <Text style={[styles.keyLabel, { color: c.primary }]}>How to tell</Text>
        <Text style={[styles.body, { color: c.text }]}>{clues.key}</Text>
      </View>
      {CLUE_ROWS.map(([field, label]) => (
        <View key={field} style={[styles.clue, { borderColor: c.border }]}>
          <Text style={[styles.clueLabel, { color: c.textMuted }]}>{label}</Text>
          <Text style={[styles.clueText, { color: c.text }]}>{clues[field]}</Text>
        </View>
      ))}
    </View>
  );
}

/** What it's mistaken for, each with the feature that tells them apart. */
export function Lookalikes({ plant, linked = true }: { plant: Plant; linked?: boolean }) {
  const c = useColors();
  const list = lookalikesOf(plant, PLANTS);
  if (!list.length) return null;
  return (
    <View style={{ gap: 8 }}>
      {list.map((p) => (
        <Pressable
          key={p.id}
          disabled={!linked}
          accessibilityRole={linked ? 'link' : undefined}
          onPress={() => router.push({ pathname: '/plant/[id]', params: { id: p.id } })}
          style={[styles.row, { borderColor: c.border, backgroundColor: c.surface }]}
        >
          <View style={styles.rowThumb}>
            <PlantPhoto plant={p} compact />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{p.commonName}</Text>
            <EdibilityBadge plant={p} />
            {PLANT_CLUES[p.id] && (
              <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 19 }}>{PLANT_CLUES[p.id].key}</Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function SafetyNote() {
  const c = useColors();
  return (
    <Text style={[styles.safety, { color: c.textMuted }]}>
      General information only. Never eat a plant or use it as medicine based on an app. Many plants have toxic
      look-alikes.
    </Text>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 23 },
  key: { borderRadius: 14, padding: 12, gap: 4 },
  keyLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  clue: { flexDirection: 'row', gap: 12, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  clueLabel: { width: 72, fontSize: 14, fontWeight: '600' },
  clueText: { flex: 1, fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1 },
  rowThumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  rowTitle: { fontSize: 17, fontWeight: '600' },
  safety: { fontSize: 13, lineHeight: 19, marginTop: 20 },
});
