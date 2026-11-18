import { en, type MessageKey } from './en';
import { catalogs } from './catalog';
import type { Language } from './languages';

export function fill(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{([a-zA-Z]+)\}/g, (token, name: string) =>
    name in vars ? String(vars[name]) : token,
  );
}

export function translate(language: Language, key: MessageKey, vars?: Record<string, string | number>): string {
  const pack = catalogs[language] ?? en;
  return fill(pack[key] || en[key], vars);
}
