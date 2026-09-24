import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Plant } from '../core/types';
import { PLANT_IMAGES } from '../data/plantImages.generated';
import { CATEGORY_EMOJI, useColors } from '../theme';

interface Props {
  plant: Plant;
  style?: StyleProp<ViewStyle>;
  /** Show the family as a hint when no photo is bundled (dev builds). Never the name. */
  showHint?: boolean;
  compact?: boolean;
}

export function PlantPhoto({ plant, style, showHint, compact }: Props) {
  const colors = useColors();
  const image = PLANT_IMAGES[plant.id];

  if (image) {
    return (
      <Image
        source={image.source}
        style={[styles.fill, style as object]}
        contentFit="cover"
        transition={150}
        accessibilityLabel="Photo of the plant to identify"
      />
    );
  }

  return (
    <View style={[styles.fill, styles.placeholder, { backgroundColor: colors.surfaceMuted }, style]}>
      <Text style={{ fontSize: compact ? 28 : 88 }}>{CATEGORY_EMOJI[plant.category]}</Text>
      {showHint && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Photo not bundled yet · family {plant.family}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
