import {
  applyLevelWin,
  createDefaultProgress,
  CURRENT_SAVE_VERSION,
  migrateProgress,
  totalStars,
} from '../progressModel';

describe('progress model', () => {
  it('unlocks the next level and keeps best results', () => {
    let progress = createDefaultProgress();
    progress = applyLevelWin(progress, 1, 5, 2, 200);
    expect(progress.unlockedLevel).toBe(2);
    progress = applyLevelWin(progress, 1, 4, 3, 200);
    progress = applyLevelWin(progress, 1, 9, 1, 200);
    expect(progress.stars['1']).toBe(3);
    expect(progress.bestMoves['1']).toBe(4);
    expect(totalStars(progress)).toBe(3);
  });

  it('does not lower the unlocked level when replaying', () => {
    let progress = { ...createDefaultProgress(), unlockedLevel: 10 };
    progress = applyLevelWin(progress, 3, 4, 3, 200);
    expect(progress.unlockedLevel).toBe(10);
  });

  it('clears the saved session for the won level', () => {
    const progress = {
      ...createDefaultProgress(),
      session: { levelNumber: 1, history: [1], hintsLeft: 3, bonusMoves: 0 },
    };
    expect(applyLevelWin(progress, 1, 3, 3, 200).session).toBeNull();
  });

  it('migrates a legacy save and drops invalid data', () => {
    const migrated = migrateProgress(
      {
        currentLevel: 7,
        stars: { '1': 3, '2': 'bad' },
        settings: { sound: false, theme: 'neon' },
        session: { levelNumber: 3, history: ['x'] },
      },
      0,
    );
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.unlockedLevel).toBe(7);
    expect(migrated.stars).toEqual({ '1': 3 });
    expect(migrated.settings).toEqual({ sound: false, music: true, haptics: true, theme: 'dark' });
    expect(migrated.session).toBeNull();
    expect(migrated.tutorialSeen).toBe(false);
  });

  it('remembers a finished tutorial and treats a missing flag as unseen', () => {
    expect(migrateProgress({ tutorialSeen: true, unlockedLevel: 4 }, 1).tutorialSeen).toBe(true);
    expect(migrateProgress({ unlockedLevel: 4 }, 1).tutorialSeen).toBe(false);
  });

  it('falls back to defaults for unreadable data', () => {
    expect(migrateProgress(null, 1)).toEqual(createDefaultProgress());
    expect(migrateProgress('garbage', 1)).toEqual(createDefaultProgress());
  });
});
