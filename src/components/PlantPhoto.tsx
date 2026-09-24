import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Plant } from '../core/types';
import { PLANT_IMAGES } from '../data/plantImages.generated';
import type { PlantImage } from '../data/plantImageTypes';
import { CATEGORY_EMOJI, useColors } from '../theme';

interface Props {
  plant: Plant;
  style?: StyleProp<ViewStyle>;
  /** Show the family as a hint when no photo is bundled (dev builds). Never the name. */
  showHint?: boolean;
  compact?: boolean;
  /** Which of the plant's photos to show; wraps around. Randomise it so users learn the plant, not one picture. */
  photo?: number;
}

export function PlantPhoto({ plant, style, showHint, compact, photo = 0 }: Props) {
  const colors = useColors();
  const image = imageFor(plant, photo);

  if (image) {
    return (
      <Image
        source={image.source}
        style={[styles.fill, style as object]}
        contentFit="cover"
        transition={150}
        // In the quiz (showHint set) the label must not give the answer away.
        accessibilityLabel={showHint === undefined ? `Photo of ${plant.commonName}` : 'Photo of the plant to identify'}
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

export function imageFor(plant: Plant, photo = 0): PlantImage | undefined {
  const images = PLANT_IMAGES[plant.id];
  return images?.length ? images[photo % images.length] : undefined;
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
