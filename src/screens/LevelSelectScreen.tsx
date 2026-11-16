import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StarRow } from '@/components/ui/StarRow';
import { UNLOCK_ALL_LEVELS } from '@/config/dev';
import { levelConfig } from '@/game/generator';
import { TOTAL_LEVELS } from '@/game/levels';
import { useTheme } from '@/hooks/useTheme';
import { feedback } from '@/services/feedback';
import { completedCount, totalStars } from '@/store/progressModel';
import { useProgressStore } from '@/store/progressStore';
import { radius, spacing } from '@/theme';

const ROW_HEIGHT = 110;
const NODE = 68;

const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

function worldLabel(level: number): string | null {
  const config = levelConfig(level);
  if (level === 1) return `${config.size}×${config.size} · Warm-up`;
  const previous = levelConfig(level - 1);
  if (config.size !== previous.size) return `${config.size}×${config.size} grid`;
  if (level === 41) return 'New: 3 colors';
  if (level === 101) return 'Master puzzles';
  return null;
}

/** Horizontal offset of a node along the winding path, from -1 to 1. */
const wave = (level: number) => Math.sin(level * 0.9);

type NodeState = 'done' | 'current' | 'locked';

interface LevelNodeProps {
  level: number;
  state: NodeState;
  stars: number;
  amplitude: number;
  onPress: (level: number) => void;
}

const LevelNode = memo(function LevelNode({ level, state, stars, amplitude, onPress }: LevelNodeProps) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state !== 'current') return;
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
    );
  }, [pulse, state]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const label = worldLabel(level);
  const offset = wave(level) * amplitude;
  const nextOffset = wave(level + 1) * amplitude;

  return (
    <View style={styles.row}>
      {/* Dotted trail toward the next node. */}
      {level < TOTAL_LEVELS
        ? [0.33, 0.66].map((t) => (
            <View
              key={t}
              style={[
                styles.trailDot,
                {
                  backgroundColor: state === 'done' ? theme.primaryGradient[0] : theme.surfacePressed,
                  transform: [
                    { translateX: offset + (nextOffset - offset) * t },
                    { translateY: ROW_HEIGHT * t },
                  ],
                },
              ]}
            />
          ))
        : null}
      {label ? (
        <View
          style={[
            styles.worldChip,
            { backgroundColor: theme.surfaceStrong },
            offset > 0 ? { left: spacing.sm } : { right: spacing.sm },
          ]}
        >
          <AppText size={12} weight="semibold" tone="muted">
            {label}
          </AppText>
        </View>
      ) : null}
      <View style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
        <Animated.View style={pulseStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={state === 'locked' ? `Level ${level}, locked` : `Level ${level}`}
            accessibilityState={{ disabled: state === 'locked' }}
            disabled={state === 'locked'}
            onPress={() => onPress(level)}
            style={[
              styles.node,
              state === 'locked' && { backgroundColor: theme.surfaceStrong },
              state === 'current' && styles.currentShadow,
            ]}
          >
            {state !== 'locked' ? (
              <LinearGradient
                colors={state === 'current' ? theme.primaryGradient : [theme.surfaceStrong, theme.surfaceStrong]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.nodeRadius]}
              />
            ) : null}
            {state === 'done' ? (
              <View style={[StyleSheet.absoluteFill, styles.nodeRadius, styles.doneRing, { borderColor: theme.primaryGradient[0] }]} />
            ) : null}
            {state === 'locked' ? (
              <Ionicons name="lock-closed" size={22} color={theme.textSubtle} />
            ) : (
              <AppText size={24} weight="bold" color={state === 'current' ? '#FFFFFF' : theme.text}>
                {level}
              </AppText>
            )}
          </Pressable>
        </Animated.View>
        <View style={styles.starSlot}>{state === 'done' ? <StarRow count={stars} size={14} /> : null}</View>
      </View>
    </View>
  );
});

export function LevelSelectScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const unlockedLevel = useProgressStore((state) => state.unlockedLevel);
  const stars = useProgressStore((state) => state.stars);

  const amplitude = Math.min(110, width * 0.24);
  const completed = completedCount({ stars });
  const starTotal = totalStars({ stars });
  const initialIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, unlockedLevel - 3));

  const onPress = useCallback(
    (level: number) => {
      feedback('button', 'selection');
      router.push(`/play/${level}`);
    },
    [router],
  );

  const nodeState = useCallback(
    (level: number): NodeState => {
      if (stars[String(level)] !== undefined) return 'done';
      const open = UNLOCK_ALL_LEVELS || level <= unlockedLevel;
      return open ? 'current' : 'locked';
    },
    [stars, unlockedLevel],
  );

  const header = useMemo(
    () => (
      <View style={[styles.summary, { backgroundColor: theme.surface }]}>
        <View style={styles.summaryRow}>
          <AppText size={15} weight="semibold">
            {completed} of {TOTAL_LEVELS} solved
          </AppText>
          <View style={styles.starTotal}>
            <Ionicons name="star" size={16} color={theme.star} />
            <AppText size={15} weight="semibold">
              {starTotal}/{TOTAL_LEVELS * 3}
            </AppText>
          </View>
        </View>
        <ProgressBar value={completed / TOTAL_LEVELS} />
      </View>
    ),
    [completed, starTotal, theme],
  );

  return (
    <Screen>
      <ScreenHeader title="Levels" onBack={() => router.back()} />
      {header}
      <FlatList
        data={levels}
        keyExtractor={String}
        renderItem={({ item }) => (
          <LevelNode
            level={item}
            state={nodeState(item)}
            stars={stars[String(item)] ?? 0}
            amplitude={amplitude}
            onPress={onPress}
          />
        )}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        initialScrollIndex={initialIndex}
        initialNumToRender={12}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.flatList}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starTotal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flatList: { marginTop: spacing.md, marginHorizontal: -spacing.lg },
  list: { paddingVertical: spacing.lg },
  row: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  nodeWrap: { alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE * 0.34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeRadius: { borderRadius: NODE * 0.34 },
  doneRing: { borderWidth: 2 },
  currentShadow: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  starSlot: { height: 18, marginTop: 4 },
  trailDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: ROW_HEIGHT / 2 - 4 - 11 },
  worldChip: {
    position: 'absolute',
    top: ROW_HEIGHT / 2 - 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
