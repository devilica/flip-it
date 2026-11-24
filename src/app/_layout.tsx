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
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { prefetchLevels } from '@/game/levels';
import { connectPlayGames } from '@/play-games/service';
import { useSettingsSync } from '@/hooks/useSettingsSync';
import { prepareRewardedAds } from '@/services/ads';
import { useTheme } from '@/hooks/useTheme';
import { themeProgress } from '@/theme/blend';
import { useFlipCodeHydrated } from '@/store/flipCodeStore';
import { useHasHydrated, useProgressStore } from '@/store/progressStore';
import { useSudokuHydrated } from '@/store/sudokuStore';

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
  const sudokuHydrated = useSudokuHydrated();
  const flipCodeHydrated = useFlipCodeHydrated();
  const theme = useTheme();
  const [lightSurface, setLightSurface] = useState(theme.name === 'light');
  const unlockedLevel = useProgressStore((state) => state.unlockedLevel);

  useAnimatedReaction(
    () => themeProgress.value >= 0.5,
    (light, previous) => {
      if (previous == null || light !== previous) runOnJS(setLightSurface)(light);
    },
  );
  const ready = (fontsLoaded || fontError !== null) && hydrated && sudokuHydrated && flipCodeHydrated;

  useSettingsSync(hydrated);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Consent, SDK init, and the first rewarded preload happen before a level can fail.
  useEffect(() => {
    if (!ready) return;
    prepareRewardedAds().catch(() => {});
    connectPlayGames().catch(() => {});
  }, [ready]);

  // Warm the level cache in the background so high levels open instantly.
  useEffect(() => {
    if (!hydrated) return undefined;
    return prefetchLevels(unlockedLevel + 1);
  }, [hydrated, unlockedLevel]);

  if (!ready) return null;

  const barStyle = lightSurface ? 'dark' : 'light';

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaProvider>
        <StatusBar style={barStyle} />
        <NavigationBar style={barStyle} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="flip" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sudoku/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sudoku/levels" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sudoku/[level]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sudoku/daily" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="flip-code/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="flip-code/play" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="flip-code/daily" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="play/[level]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="daily" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="levels" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="leaderboards" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
