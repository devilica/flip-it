import { mapCell, orientLevel } from '../orient';
import { uniqueSolution } from '../solver';
import type { SudokuLevel } from '../types';

const square: SudokuLevel = {
  id: 1,
  size: 2,
  regions: [0, 0, 1, 1],
  given: [],
  blocked: [1],
  magnifier: 0,
  lightbulb: 2,
  eraser: 0,
};

describe('sudoku orientation', () => {
  it('turns the top-left corner to the top-right', () => {
    expect(mapCell(4, 0, 1)).toBe(3);
  });

  it('keeps one solution and moves it with the board', () => {
    const solution = uniqueSolution(square);
    expect(solution).not.toBeNull();
    const turned = orientLevel(square, 1);
    const next = uniqueSolution(turned);
    const mapped = solution!.map((cell) => mapCell(square.size, cell, 1)).sort((a, b) => a - b);
    expect(next!.slice().sort((a, b) => a - b)).toEqual(mapped);
  });
});
