import { calculateWinner, isDraw } from './tic-tac-toe';

describe('tic-tac-toe helpers', () => {
  it('detects a winner and line', () => {
    const result = calculateWinner(['X', 'X', 'X', null, 'O', null, 'O', null, null]);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([0, 1, 2]);
  });

  it('detects a draw', () => {
    const squares = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as any;
    expect(isDraw(squares, null)).toBeTrue();
  });
});
