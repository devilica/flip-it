import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { prefetchLevels } from '@/game/levels';
import { useSettingsSync } from '@/hooks/useSettingsSync';
import { prepareRewardedAds } from '@/services/ads';
import { useTheme } from '@/hooks/useTheme';
import { useHasHydrated, useProgressStore } from '@/store/progressStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    ...Ionicons.font,
  });
  const hydrated = useHasHydrated();
  const theme = useTheme();
  const unlockedLevel = useProgressStore((state) => state.unlockedLevel);
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useSettingsSync(hydrated);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Consent, SDK init, and the first rewarded preload happen before a level can fail.
  useEffect(() => {
    if (!ready) return;
    prepareRewardedAds().catch(() => {});
  }, [ready]);

  // Warm the level cache in the background so high levels open instantly.
  useEffect(() => {
    if (!hydrated) return undefined;
    return prefetchLevels(unlockedLevel + 1);
  }, [hydrated, unlockedLevel]);

  if (!ready) return null;

  const barStyle = theme.name === 'dark' ? 'light' : 'dark';

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaProvider>
        <StatusBar style={barStyle} />
        <NavigationBar style={barStyle} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="play/[level]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="daily" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="levels" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
