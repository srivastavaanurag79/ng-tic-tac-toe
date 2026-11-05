import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';

type AiCell = 'X' | 'O' | '';
type AiBoard = [AiCell[], AiCell[], AiCell[]];

@Component({
  selector: 'app-ai',
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.css']
})
export class AiComponent implements OnInit {
  squares: AiBoard = this.emptyBoard();
  winner: 'X' | 'O' | 'tie' | null = null;
  winnerName = '';
  gameOver = false;
  playerCheck = false;
  startingPlayer: 'human' | 'ai' = 'ai';
  level: 'easy' | 'insane' = 'insane';
  player1 = '';
  player2 = 'Computer';
  player1Count = 0;
  player2Count = 0;
  clickCount = 0;
  ai: 'X' = 'X';
  human: 'O' = 'O';
  currentPlayer: 'X' | 'O' = 'X';
  winningLine: Array<{ i: number; j: number }> = [];

  private readonly scores: Record<string, number> = { X: 10, O: -10, tie: 0 };

  constructor(private toastrService: NbToastrService, private router: Router) { }

  home(): void {
    if (this.shouldConfirmLeave()) {
      this.toastrService.show('Finish or reset the current game before leaving.', 'Game in progress', { status: 'warning' });
      return;
    }
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.resetBoardState();
  }

  submitPlayerData(form: { player1?: string; startingPlayer?: 'human' | 'ai'; level?: 'easy' | 'insane' }): void {
    const name = (form.player1 || '').trim();
    if (!name) {
      this.toastrService.show('Please enter your name.', 'Missing data', { status: 'warning' });
      return;
    }
    this.player1 = name;
    this.startingPlayer = form.startingPlayer || this.startingPlayer;
    this.level = form.level || this.level;
    this.playerCheck = true;
    this.startRound();
  }

  resetGame(): void {
    if (this.shouldConfirmLeave() && !confirm('Reset scores and player data?')) {
      return;
    }
    this.resetBoardState();
    this.player1Count = 0;
    this.player2Count = 0;
    this.player1 = '';
    this.player2 = 'Computer';
    this.playerCheck = false;
  }

  newGame(): void {
    this.resetBoardState();
    if (this.playerCheck) {
      this.startRound();
    }
  }

  private emptyBoard(): AiBoard {
    return [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
  }

  private resetBoardState(): void {
    this.squares = this.emptyBoard();
    this.winner = null;
    this.winnerName = '';
    this.clickCount = 0;
    this.gameOver = false;
    this.currentPlayer = this.ai;
    this.winningLine = [];
  }

  private startRound(): void {
    if (this.startingPlayer === 'ai') {
      this.currentPlayer = this.ai;
      this.computerMove();
    } else {
      this.currentPlayer = this.human;
    }
  }

  get statusMessage(): string {
    if (this.gameOver && this.winner === 'tie') {
      return 'Match drawn.';
    }
    if (this.gameOver && this.winnerName) {
      return `${this.winnerName} won the game.`;
    }
    const who = this.currentPlayer === this.human ? (this.player1 || 'Human') : 'Computer';
    return `Current player: ${who} (${this.currentPlayer}).`;
  }

  isWinningCell(i: number, j: number): boolean {
    return this.winningLine.some((c) => c.i === i && c.j === j);
  }

  cellLabel(i: number, j: number): string {
    const value = this.squares[i][j];
    return `Row ${i + 1}, column ${j + 1}: ${value || 'empty'}`;
  }

  makeMove(i: number, j: number): void {
    if (this.gameOver || this.currentPlayer !== this.human) {
      return;
    }
    if (this.squares[i][j]) {
      this.toastrService.show('This tile is already taken', 'Warning', { status: 'warning' });
      return;
    }
    this.squares[i][j] = this.human;
    this.clickCount++;
    if (this.resolveWinner()) {
      return;
    }
    this.currentPlayer = this.ai;
    this.computerMove();
  }

  private computerMove(): void {
    if (this.gameOver) {
      return;
    }
    if (this.level === 'easy') {
      this.badMove();
    } else {
      this.bestMove();
    }
    if (!this.gameOver) {
      this.currentPlayer = this.human;
    }
  }

  private resolveWinner(): boolean {
    const result = this.findWinner(this.squares);
    if (!result.winner) {
      return false;
    }
    this.winner = result.winner;
    this.winningLine = result.line;
    if (this.winner === 'X') {
      this.player2Count++;
      this.winnerName = this.player2;
    } else if (this.winner === 'O') {
      this.player1Count++;
      this.winnerName = this.player1;
    } else {
      this.winnerName = '';
    }
    setTimeout(() => { this.gameOver = true; }, 250);
    return true;
  }

  private equals3(a: AiCell, b: AiCell, c: AiCell): AiCell | false {
    return a !== '' && a === b && b === c ? a : false;
  }

  checkWinner(): 'X' | 'O' | 'tie' | null {
    return this.findWinner(this.squares).winner;
  }

  private findWinner(board: AiBoard): { winner: 'X' | 'O' | 'tie' | null; line: Array<{ i: number; j: number }> } {
    for (let i = 0; i < 3; i++) {
      if (this.equals3(board[i][0], board[i][1], board[i][2])) {
        return { winner: board[i][0] as 'X' | 'O', line: [{ i, j: 0 }, { i, j: 1 }, { i, j: 2 }] };
      }
    }
    for (let j = 0; j < 3; j++) {
      if (this.equals3(board[0][j], board[1][j], board[2][j])) {
        return { winner: board[0][j] as 'X' | 'O', line: [{ i: 0, j }, { i: 1, j }, { i: 2, j }] };
      }
    }
    if (this.equals3(board[0][0], board[1][1], board[2][2])) {
      return { winner: board[0][0] as 'X' | 'O', line: [{ i: 0, j: 0 }, { i: 1, j: 1 }, { i: 2, j: 2 }] };
    }
    if (this.equals3(board[2][0], board[1][1], board[0][2])) {
      return { winner: board[2][0] as 'X' | 'O', line: [{ i: 2, j: 0 }, { i: 1, j: 1 }, { i: 0, j: 2 }] };
    }
    const openSpots = board.some((row) => row.some((cell) => cell === ''));
    return openSpots ? { winner: null, line: [] } : { winner: 'tie', line: [] };
  }

  badMove(): void {
    const empty: Array<{ i: number; j: number }> = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!this.squares[i][j]) {
          empty.push({ i, j });
        }
      }
    }
    if (!empty.length) {
      this.resolveWinner();
      return;
    }
    const pick = empty[Math.floor(Math.random() * empty.length)];
    this.squares[pick.i][pick.j] = this.ai;
    this.clickCount++;
    this.resolveWinner();
  }

  bestMove(): void {
    let bestScore = -Infinity;
    let move: { i: number; j: number } | null = null;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!this.squares[i][j]) {
          this.squares[i][j] = this.ai;
          const score = this.minimax(this.squares, 0, false);
          this.squares[i][j] = '';
          if (score > bestScore) {
            bestScore = score;
            move = { i, j };
          }
        }
      }
    }
    if (!move) {
      this.resolveWinner();
      return;
    }
    this.squares[move.i][move.j] = this.ai;
    this.clickCount++;
    this.resolveWinner();
  }

  minimax(board: AiBoard, depth: number, isMaximizing: boolean): number {
    const result = this.findWinner(board).winner;
    if (result !== null) {
      const score = this.scores[result];
      return result === 'X' ? score - depth : result === 'O' ? score + depth : score;
    }
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (!board[i][j]) {
            board[i][j] = this.ai;
            bestScore = Math.max(bestScore, this.minimax(board, depth + 1, false));
            board[i][j] = '';
          }
        }
      }
      return bestScore;
    }
    let bestScore = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!board[i][j]) {
          board[i][j] = this.human;
          bestScore = Math.min(bestScore, this.minimax(board, depth + 1, true));
          board[i][j] = '';
        }
      }
    }
    return bestScore;
  }

  private shouldConfirmLeave(): boolean {
    return this.playerCheck && !this.gameOver && this.clickCount > 0;
  }
}
