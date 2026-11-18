import { isBlocked, isGiven } from '../rules';
import { SUDOKU_LEVELS } from '../levels';
import { uniqueSolution } from '../solver';

describe('Flip Sudoku levels', () => {
  it('has two hundred puzzles with increasing boards', () => {
    expect(SUDOKU_LEVELS).toHaveLength(200);
    const sizes = SUDOKU_LEVELS.map((level) => level.size);
    expect(sizes).toEqual([
      ...Array<number>(16).fill(4),
      ...Array<number>(24).fill(5),
      ...Array<number>(30).fill(6),
      ...Array<number>(30).fill(7),
      ...Array<number>(40).fill(8),
      ...Array<number>(40).fill(9),
      ...Array<number>(20).fill(10),
    ]);
  });

  it.each(SUDOKU_LEVELS.map((level) => [level.id, level] as const))(
    'level %s has one solution, no open mascot, and one single-cell color',
    (_id, level) => {
      const solution = uniqueSolution(level);
      expect(solution).not.toBeNull();
      const solved = new Set(solution);
      expect(solution).toHaveLength(level.size);

      const rows = new Set(solution!.map((cell) => Math.floor(cell / level.size)));
      const cols = new Set(solution!.map((cell) => cell % level.size));
      const regions = new Set(solution!.map((cell) => level.regions[cell]));
      expect(rows.size).toBe(level.size);
      expect(cols.size).toBe(level.size);
      expect(regions.size).toBe(level.size);

      expect(level.given).toEqual([]);
      const counts = new Map<number, number>();
      for (const region of level.regions) counts.set(region, (counts.get(region) ?? 0) + 1);
      const singles = [...counts.entries()].filter(([, count]) => count === 1);
      expect(singles).toHaveLength(1);
      const start = level.regions.indexOf(singles[0][0]);
      expect(solved.has(start)).toBe(true);
      expect(isGiven(level, start)).toBe(false);
      for (const cell of level.blocked) {
        expect(solved.has(cell)).toBe(false);
        expect(isBlocked(level, cell)).toBe(true);
      }
      expect(new Set(level.regions).size).toBe(level.size);
    },
  );
});
