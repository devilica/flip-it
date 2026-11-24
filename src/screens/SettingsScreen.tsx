import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { GameButton, type IconName } from '@/components/ui/GameButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useTheme } from '@/hooks/useTheme';
import { languageOptions, useI18n } from '@/i18n';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages';
import { feedback } from '@/services/feedback';
import { useFlipCodeStore } from '@/store/flipCodeStore';
import { useProgressStore } from '@/store/progressStore';
import { useSudokuStore } from '@/store/sudokuStore';
import { darkTheme, lightTheme, palette, radius, spacing } from '@/theme';
import { themeProgress } from '@/theme/blend';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRIVACY_URL = 'https://devilica.github.io/flip-it/privacy/';
const TERMS_URL = 'https://devilica.github.io/flip-it/terms/';

function LinkRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.surfaceStrong, lightTheme.surfaceStrong]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.surface, lightTheme.surface]),
  }));
  const nameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(themeProgress.value, [0, 1], [darkTheme.text, lightTheme.text]),
  }));
  return (
    <AnimatedPressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.select, rowStyle]}
    >
      <Animated.View style={[styles.linkIcon, iconStyle]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </Animated.View>
      <Animated.Text style={[styles.nativeName, nameStyle]}>{label}</Animated.Text>
      <Ionicons name="open-outline" size={20} color={theme.textMuted} />
    </AnimatedPressable>
  );
}

function LanguageOption({
  selected,
  flag,
  name,
  onPress,
}: {
  selected: boolean;
  flag: string;
  name: string;
  onPress: () => void;
}) {
  const optionStyle = useAnimatedStyle(() => ({
    backgroundColor: selected
      ? interpolateColor(themeProgress.value, [0, 1], [darkTheme.surfaceStrong, lightTheme.surfaceStrong])
      : 'transparent',
  }));
  const nameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(themeProgress.value, [0, 1], [darkTheme.text, lightTheme.text]),
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, optionStyle]}
    >
      <Text style={styles.flag}>{flag}</Text>
      <Animated.Text style={[styles.nativeName, nameStyle]}>{name}</Animated.Text>
      {selected ? <Ionicons name="checkmark" size={20} color={palette.purple} /> : null}
    </AnimatedPressable>
  );
}

function LanguageSelect() {
  const theme = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const language = useProgressStore((state) => state.settings.language);
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const [open, setOpen] = useState(false);
  const selectStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.surfaceStrong, lightTheme.surfaceStrong]),
  }));
  const nameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(themeProgress.value, [0, 1], [darkTheme.text, lightTheme.text]),
  }));
  const menuStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], [darkTheme.background, lightTheme.background]),
  }));
  const current =
    SUPPORTED_LANGUAGES.find((item) => item.code === language) ??
    SUPPORTED_LANGUAGES.find((item) => item.code === 'en') ??
    SUPPORTED_LANGUAGES[0];

  const choose = (code: Language) => {
    updateSettings({ language: code });
    feedback('button', 'selection');
    setOpen(false);
  };

  return (
    <>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t('language')}
        onPress={() => {
          feedback('button', 'selection');
          setOpen(true);
        }}
        style={[styles.select, selectStyle]}
      >
        <Text style={styles.flag}>{current.flag}</Text>
        <Animated.Text style={[styles.nativeName, nameStyle]}>{current.nativeName}</Animated.Text>
        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
      </AnimatedPressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <Animated.View style={[styles.menu, menuStyle, { maxHeight: height * 0.7 }]}>
            <AppText size={18} weight="bold">
              {t('language')}
            </AppText>
            <ScrollView style={{ maxHeight: height * 0.56 }} showsVerticalScrollIndicator={false}>
              {languageOptions().map((item) => {
                const selected = item.code === language;
                return (
                  <LanguageOption
                    key={item.code}
                    selected={selected}
                    flag={item.flag}
                    name={item.nativeName}
                    onPress={() => choose(item.code)}
                  />
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText size={13} weight="semibold" tone="subtle" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const settings = useProgressStore((state) => state.settings);
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const resetFlipIt = useProgressStore((state) => state.resetProgress);
  const resetSudoku = useSudokuStore((state) => state.resetProgress);
  const resetFlipCode = useFlipCodeStore((state) => state.resetProgress);

  const confirmReset = () => {
    Alert.alert(t('resetTitle'), t('resetBody'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset'),
          style: 'destructive',
          onPress: () => {
            resetFlipIt();
            resetSudoku();
            resetFlipCode();
            feedback(null, 'warning');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScreenHeader title={t('settings')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title={t('audio').toLocaleUpperCase()}>
          <ToggleRow icon="volume-high" label={t('soundEffects')} value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
          <ToggleRow icon="musical-notes" label={t('music')} value={settings.music} onChange={(music) => updateSettings({ music })} />
        </Section>
        <Section title={t('feel').toLocaleUpperCase()}>
          <ToggleRow icon="phone-portrait" label={t('vibration')} value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        </Section>
        <Section title={t('appearance').toLocaleUpperCase()}>
          <ToggleRow
            icon={settings.theme === 'dark' ? 'moon' : 'sunny'}
            label={t('darkTheme')}
            value={settings.theme === 'dark'}
            onChange={(dark) => updateSettings({ theme: dark ? 'dark' : 'light' })}
          />
        </Section>
        <Section title={t('language').toLocaleUpperCase()}>
          <LanguageSelect />
        </Section>
        <Section title={t('legal').toLocaleUpperCase()}>
          <LinkRow
            icon="shield-checkmark-outline"
            label={t('privacyPolicy')}
            onPress={() => {
              feedback('button', 'selection');
              Linking.openURL(PRIVACY_URL).catch(() => {});
            }}
          />
          <LinkRow
            icon="document-text-outline"
            label={t('termsOfUse')}
            onPress={() => {
              feedback('button', 'selection');
              Linking.openURL(TERMS_URL).catch(() => {});
            }}
          />
        </Section>
        <Section title={t('data').toLocaleUpperCase()}>
          <GameButton label={t('resetProgress')} icon="trash" variant="danger" onPress={confirmReset} />
        </Section>
        <AppText size={13} tone="subtle" align="center" style={styles.footer}>
          {t('footer')}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.xl, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  sectionBody: { gap: spacing.sm },
  footer: { marginTop: spacing.md },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  menu: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  flag: { fontSize: 22 },
  nativeName: { flex: 1, fontSize: 16 },
});
