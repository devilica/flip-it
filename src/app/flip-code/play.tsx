import { useLocalSearchParams } from 'expo-router';

import { FlipCodeScreen } from '@/screens/FlipCodeScreen';
import type { Difficulty } from '@/flip-code/types';

const allowed = new Set<Difficulty>(['easy', 'medium', 'hard']);

export default function FlipCodePlayRoute() {
  const { difficulty } = useLocalSearchParams<{ difficulty?: string }>();
  const value = allowed.has(difficulty as Difficulty) ? (difficulty as Difficulty) : 'easy';
  return <FlipCodeScreen difficulty={value} />;
}
