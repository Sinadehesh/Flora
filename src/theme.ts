import { Platform, useColorScheme } from 'react-native';

const light = {
  background: '#F6F4EE',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEFE6',
  text: '#1C2A21',
  textMuted: '#5E6B61',
  border: '#DCE1D5',
  primary: '#2F5D43',
  onPrimary: '#FFFFFF',
  accent: '#C4546A',
  success: '#2E7D4F',
  warning: '#A5660F',
  danger: '#B3413A',
  overlay: 'rgba(12, 20, 15, 0.72)',
};

const dark: typeof light = {
  background: '#101612',
  surface: '#18211B',
  surfaceMuted: '#212C24',
  text: '#E8EDE6',
  textMuted: '#9AA79D',
  border: '#2C3930',
  primary: '#8CC9A0',
  onPrimary: '#0F1F15',
  accent: '#E58A9B',
  success: '#7BD19A',
  warning: '#E9B35F',
  danger: '#F08A80',
  overlay: 'rgba(0, 0, 0, 0.78)',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
});

export const CATEGORY_EMOJI = { flower: '🌸', houseplant: '🪴', tree: '🌳' } as const;
export const CATEGORY_LABEL = { flower: 'Flowers', houseplant: 'Houseplants', tree: 'Trees' } as const;
