import { useProgressStore } from '@/store/progressStore';
import { themes, type Theme } from '@/theme';

export function useTheme(): Theme {
  const name = useProgressStore((state) => state.settings.theme);
  return themes[name];
}
