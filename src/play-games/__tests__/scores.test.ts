import { confirmScore, considerScore, emptyScoreMemory, readScoreMemory } from '../scores';

describe('play games scores', () => {
  it('rejects a score that is not a real result', () => {
    const memory = emptyScoreMemory();
    expect(considerScore(memory, 'flip-it', 1.5).send).toBeNull();
    expect(considerScore(memory, 'flip-it', -1).send).toBeNull();
    expect(considerScore(memory, 'flip-it', 901).send).toBeNull();
    expect(considerScore(memory, 'flip-it', 1.5).memory).toBe(memory);
  });

  it('skips a score that was already accepted', () => {
    const memory = { submitted: { 'flip-it': 12 }, pending: {} };
    const decision = considerScore(memory, 'flip-it', 12);
    expect(decision.send).toBeNull();
    expect(decision.memory).toBe(memory);
  });

  it('keeps the higher score when the send cannot finish', () => {
    const first = considerScore(emptyScoreMemory(), 'flip-sudoku', 4);
    expect(first.send).toBe(4);
    const again = considerScore(first.memory, 'flip-sudoku', 2);
    expect(again.send).toBe(4);
    expect(again.memory.pending['flip-sudoku']).toBe(4);
    const better = considerScore(again.memory, 'flip-sudoku', 9);
    expect(better.send).toBe(9);
    const done = confirmScore(better.memory, 'flip-sudoku', 9);
    expect(done.submitted['flip-sudoku']).toBe(9);
    expect(done.pending['flip-sudoku']).toBeUndefined();
    expect(considerScore(done, 'flip-sudoku', 9).send).toBeNull();
  });

  it('drops a saved score that is not a whole number', () => {
    const memory = readScoreMemory('{"submitted":{"flip-code":2.2,"flip-it":3},"pending":{"nope":4}}');
    expect(memory.submitted).toEqual({ 'flip-it': 3 });
    expect(memory.pending).toEqual({});
  });
});
