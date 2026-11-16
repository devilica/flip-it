import { useLocalSearchParams } from 'expo-router';

import { GameScreen } from '@/screens/GameScreen';

export default function PlayRoute() {
  const params = useLocalSearchParams<{ level: string; resume?: string }>();
  const level = Number.parseInt(params.level ?? '1', 10) || 1;
  return <GameScreen key={level} mode="level" levelNumber={level} resume={params.resume === '1'} />;
}
