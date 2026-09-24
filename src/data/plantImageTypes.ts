import type { ImageSourcePropType } from 'react-native';

export interface PlantImage {
  source: ImageSourcePropType;
  /** Required by CC BY / CC BY-SA licences; listed on the Credits screen only. */
  credit: { author: string; license: string; sourceUrl: string };
}
