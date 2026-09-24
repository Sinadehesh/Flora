import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PLANT_IMAGES } from '../data/plantImages.generated';
import { PLANTS_BY_ID } from '../data/plants';
import { useColors } from '../theme';

/** Attribution for every bundled photo — required by CC BY / CC BY-SA licenses. */
export default function Credits() {
  const c = useColors();
  const entries = Object.entries(PLANT_IMAGES).sort(([a], [b]) => a.localeCompare(b));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{ color: c.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
        Plant photos come from Wikimedia Commons under open licenses. Tap a credit to see the original.
      </Text>
      {entries.length === 0 && (
        <Text style={{ color: c.textMuted }}>No photos bundled yet — run `npm run fetch-images`.</Text>
      )}
      {entries.map(([id, { credit }]) => (
        <View key={id} style={[styles.row, { borderColor: c.border }]}>
          <Text style={{ color: c.text, fontWeight: '600' }}>{PLANTS_BY_ID[id]?.commonName ?? id}</Text>
          <Text style={{ color: c.primary }} onPress={() => Linking.openURL(credit.sourceUrl)}>
            {credit.author} · {credit.license}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
});
