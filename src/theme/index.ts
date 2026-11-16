import type { ThemeName } from '@/store/progressModel';

export const palette = {
  navy: '#101426',
  purple: '#8B5CF6',
  blue: '#38BDF8',
  coral: '#FB7185',
  white: '#FFFFFF',
  gold: '#FCD34D',
} as const;

export interface Theme {
  name: ThemeName;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  surfacePressed: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  divider: string;
  boardBackdrop: string;
  boardShadow: string;
  orbOpacity: number;
  overlay: string;
  primaryGradient: [string, string];
  dangerGradient: [string, string];
  /** Tile colors by color index. Two-color boards use the first two. */
  tiles: [string, string, string];
  tileShine: string;
  star: string;
  starEmpty: string;
}

export const darkTheme: Theme = {
  name: 'dark',
  background: palette.navy,
  backgroundAlt: '#151A33',
  surface: 'rgba(255,255,255,0.06)',
  surfaceStrong: '#1B2140',
  surfacePressed: 'rgba(255,255,255,0.12)',
  text: palette.white,
  textMuted: 'rgba(255,255,255,0.64)',
  textSubtle: 'rgba(255,255,255,0.38)',
  divider: 'rgba(255,255,255,0.08)',
  boardBackdrop: '#181E3B',
  boardShadow: 'rgba(0,0,0,0.45)',
  orbOpacity: 0.32,
  overlay: 'rgba(8,10,22,0.78)',
  primaryGradient: [palette.purple, palette.blue],
  dangerGradient: ['#F43F5E', palette.coral],
  tiles: [palette.purple, palette.blue, palette.coral],
  tileShine: 'rgba(255,255,255,0.28)',
  star: palette.gold,
  starEmpty: 'rgba(255,255,255,0.14)',
};

export const lightTheme: Theme = {
  name: 'light',
  background: '#F1F2FA',
  backgroundAlt: '#E6E8F6',
  surface: 'rgba(16,20,38,0.05)',
  surfaceStrong: '#FFFFFF',
  surfacePressed: 'rgba(16,20,38,0.1)',
  text: palette.navy,
  textMuted: 'rgba(16,20,38,0.62)',
  textSubtle: 'rgba(16,20,38,0.38)',
  divider: 'rgba(16,20,38,0.08)',
  boardBackdrop: '#FFFFFF',
  boardShadow: 'rgba(60,50,140,0.18)',
  orbOpacity: 0.2,
  overlay: 'rgba(241,242,250,0.86)',
  primaryGradient: [palette.purple, palette.blue],
  dangerGradient: ['#F43F5E', palette.coral],
  tiles: [palette.purple, palette.blue, palette.coral],
  tileShine: 'rgba(255,255,255,0.32)',
  star: '#F59E0B',
  starEmpty: 'rgba(16,20,38,0.12)',
};

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, light: lightTheme };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const fonts = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export type FontWeightName = keyof typeof fonts;
