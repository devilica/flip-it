export const SUPPORTED_LANGUAGES = [
  { code: 'ar', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bg', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'bn', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'bs', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'cs', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'es-mx', nativeName: 'Español (México)', flag: '🇲🇽' },
  { code: 'et', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'fa', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'ga', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'he', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hr', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'hu', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'id', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'lt', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'mk', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'ms', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'mt', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'nl', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'pt', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'pt-br', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'ro', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'sk', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'sq', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'sr-cy', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sr', nativeName: 'Srpski', flag: '🇷🇸' },
  { code: 'sv', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'th', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'vi', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', nativeName: '中文', flag: '🇨🇳' },
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const LANGUAGE_CODES: Language[] = SUPPORTED_LANGUAGES.map((language) => language.code);

const languageByCode = new Map(SUPPORTED_LANGUAGES.map((language) => [language.code, language]));

/** Scripts Fredoka does not draw. These use the device font. */
export const SYSTEM_FONT_LANGUAGES = new Set<Language>([
  'ar',
  'bg',
  'bn',
  'el',
  'fa',
  'he',
  'hi',
  'ja',
  'ko',
  'mk',
  'ru',
  'sr-cy',
  'th',
  'uk',
  'zh',
]);

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && languageByCode.has(value as Language);
}

export function languageOptions(): typeof SUPPORTED_LANGUAGES[number][] {
  return [...SUPPORTED_LANGUAGES].sort((a, b) => a.nativeName.localeCompare(b.nativeName, 'en'));
}
