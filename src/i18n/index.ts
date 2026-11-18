import { useCallback } from 'react';

import { useProgressStore } from '@/store/progressStore';

import type { MessageKey, Messages } from './en';
import { isLanguage, type Language } from './languages';
import { translate } from './translate';

export type { Language, MessageKey, Messages };
export { isLanguage, languageOptions, SYSTEM_FONT_LANGUAGES, SUPPORTED_LANGUAGES } from './languages';
export { fill, translate } from './translate';

export function useI18n() {
  const language = useProgressStore((state) => (isLanguage(state.settings.language) ? state.settings.language : 'en'));
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
  return { language, t };
}
