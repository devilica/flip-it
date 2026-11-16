import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, type FontWeightName } from '@/theme';

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
  const theme = useTheme();
  const toneColor =
    tone === 'muted'
      ? theme.textMuted
      : tone === 'subtle'
        ? theme.textSubtle
        : tone === 'inverse'
          ? '#FFFFFF'
          : theme.text;
  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[
        styles.base,
        { fontSize: size, lineHeight: Math.round(size * 1.25), fontFamily: fonts[weight] },
        { color: color ?? toneColor, textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
