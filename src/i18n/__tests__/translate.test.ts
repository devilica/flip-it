import { migrateProgress } from '@/store/progressModel';

import { en } from '../en';
import { LANGUAGE_CODES } from '../languages';
import { catalogs } from '../catalog';
import { translate } from '../translate';

const placeholders = (value: string) => [...value.matchAll(/\{[a-zA-Z]+\}/g)].map((match) => match[0]).sort();

describe('translations', () => {
  it('fills numbers in a sentence', () => {
    expect(translate('en', 'levelSolved', { n: 4 })).toBe('Level can be solved in 4 moves');
    expect(translate('en', 'movesLeft', { n: 2 })).toBe('2 moves left');
  });

  it('keeps English when a save has no language and drops an unknown code', () => {
    expect(migrateProgress({ unlockedLevel: 3 }, 1).settings.language).toBe('en');
    expect(migrateProgress({ settings: { language: 'zz' } }, 1).settings.language).toBe('en');
    expect(migrateProgress({ settings: { language: 'hr', sound: false } }, 1).settings.language).toBe('hr');
  });

  it('gives every language the same keys and the same placeholders', () => {
    const keys = Object.keys(en);
    expect(LANGUAGE_CODES).toHaveLength(46);
    for (const language of LANGUAGE_CODES) {
      expect(Object.keys(catalogs[language]).sort()).toEqual([...keys].sort());
      for (const key of keys as (keyof typeof en)[]) {
        expect(catalogs[language][key].length).toBeGreaterThan(0);
        expect(placeholders(catalogs[language][key])).toEqual(placeholders(en[key]));
        if (language !== 'en' && (key === 'chooseGame' || key === 'howToPlay' || key === 'resetBody')) {
          expect(catalogs[language][key]).not.toBe(en[key]);
        }
      }
    }
  });
});
