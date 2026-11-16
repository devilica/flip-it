import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={onBack} size={46} />
      <AppText size={26} weight="bold" style={styles.title}>
        {title}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  title: { flex: 1 },
  right: { minWidth: 46, alignItems: 'flex-end' },
});
