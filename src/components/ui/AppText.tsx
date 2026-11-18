import { StyleSheet, type TextProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { isLanguage, SYSTEM_FONT_LANGUAGES } from '@/i18n/languages';
import { useProgressStore } from '@/store/progressStore';
import { darkTheme, fonts, lightTheme, type FontWeightName } from '@/theme';
import { themeProgress } from '@/theme/blend';

const systemWeight: Record<FontWeightName, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

type Tone = 'default' | 'muted' | 'subtle' | 'inverse';

interface AppTextProps extends TextProps {
  size?: number;
  weight?: FontWeightName;
  tone?: Tone;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function AppText({
  size = 16,
  weight = 'medium',
  tone = 'default',
  color,
  align,
  style,
  ...rest
}: AppTextProps) {
  const language = useProgressStore((state) => state.settings.language);
  const systemFont = isLanguage(language) && SYSTEM_FONT_LANGUAGES.has(language);
  const toneStyle = useAnimatedStyle(() => {
    if (color) return {};
    const pair =
      tone === 'muted'
        ? [darkTheme.textMuted, lightTheme.textMuted]
        : tone === 'subtle'
          ? [darkTheme.textSubtle, lightTheme.textSubtle]
          : tone === 'inverse'
            ? ['#FFFFFF', '#FFFFFF']
            : [darkTheme.text, lightTheme.text];
    return { color: interpolateColor(themeProgress.value, [0, 1], pair) };
  }, [color, tone]);
  return (
    <Animated.Text
      allowFontScaling={false}
      {...rest}
      style={[
        styles.base,
        {
          fontSize: size,
          lineHeight: Math.round(size * 1.25),
          fontFamily: systemFont ? undefined : fonts[weight],
          fontWeight: systemFont ? systemWeight[weight] : undefined,
        },
        toneStyle,
        color ? { color, textAlign: align } : { textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
