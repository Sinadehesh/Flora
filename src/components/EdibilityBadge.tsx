import { StyleSheet, Text, View } from 'react-native';

import type { Plant } from '../core/types';
import { EDIBILITY_LABEL, PLANT_DETAILS, type Edibility } from '../data/plantDetails';
import { useColors, type Colors } from '../theme';

const edibilityColor = (e: Edibility, c: Colors) =>
  ({ edible: c.success, caution: c.warning, toxic: c.danger, inedible: c.textMuted })[e];

export const isToxic = (plant: Plant) => PLANT_DETAILS[plant.id]?.edibility === 'toxic';

/** Edibility as a coloured pill. Never shown while a question is open: it could give the answer away. */
export function EdibilityBadge({ plant }: { plant: Plant }) {
  const c = useColors();
  const edibility = PLANT_DETAILS[plant.id]?.edibility;
  if (!edibility) return null;
  const color = edibilityColor(edibility, c);
  return (
    <View
      style={[styles.badge, { borderColor: color }]}
      accessibilityLabel={`Edibility: ${EDIBILITY_LABEL[edibility]}`}
    >
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{EDIBILITY_LABEL[edibility]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
});
