import type { ImageSourcePropType } from 'react-native';

export interface PlantImage {
  source: ImageSourcePropType;
  /** Required for CC BY / CC BY-SA photos; shown on the plant page and Credits screen. */
  credit: { author: string; license: string; sourceUrl: string };
}
