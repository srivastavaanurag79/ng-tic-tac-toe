import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { calculateWinner, Cell, isDraw } from '../shared/tic-tac-toe';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {
  squares: Cell[] = [];
  xIsNext = true;
  winner: Cell = null;
  winningLine: number[] = [];
  player1 = '';
  player2 = '';
  playerCheck = false;
  player1Count = 0;
  player2Count = 0;

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

  submitPlayerData(form: { player1?: string; player2?: string }): void {
    const p1 = (form.player1 || '').trim();
    const p2 = (form.player2 || '').trim();
    if (!p1 || !p2) {
      this.toastrService.show('Please enter names for both players.', 'Missing data', { status: 'warning' });
      return;
    }
    if (p1.toLowerCase() === p2.toLowerCase()) {
      this.toastrService.show('Players must have different names.', 'Invalid names', { status: 'warning' });
      return;
    }
    this.player1 = p1;
    this.player2 = p2;
    this.playerCheck = true;
  }

  resetGame(): void {
    if (this.shouldConfirmLeave() && !confirm('Reset scores and player data?')) {
      return;
    }
    this.resetBoardState();
    this.player1Count = 0;
    this.player2Count = 0;
    this.player1 = '';
    this.player2 = '';
    this.playerCheck = false;
  }

  newGame(): void {
    this.resetBoardState();
  }

  private resetBoardState(): void {
    this.squares = Array(9).fill(null);
    this.winner = null;
    this.winningLine = [];
    this.xIsNext = true;
  }

  get player(): string {
    return this.xIsNext ? this.player1 : this.player2;
  }

  get playerValue(): Cell {
    return this.xIsNext ? 'X' : 'O';
  }

  get isDraw(): boolean {
    return isDraw(this.squares, this.winner);
  }

  get gameOver(): boolean {
    return this.winner !== null || this.isDraw;
  }

  get statusMessage(): string {
    if (this.winner === 'X') {
      return `${this.player1} won the game.`;
    }
    if (this.winner === 'O') {
      return `${this.player2} won the game.`;
    }
    if (this.isDraw) {
      return 'It is a draw.';
    }
    return `Current player: ${this.player} (${this.playerValue}).`;
  }

  isWinningSquare(idx: number): boolean {
    return this.winningLine.includes(idx);
  }

  squareLabel(idx: number): string {
    const row = Math.floor(idx / 3) + 1;
    const col = (idx % 3) + 1;
    const value = this.squares[idx];
    if (value) {
      return `Row ${row}, column ${col}: ${value}`;
    }
    return `Row ${row}, column ${col}: empty`;
  }

  makeMove(idx: number): void {
    if (this.gameOver) {
      return;
    }
    if (this.squares[idx]) {
      this.toastrService.show('This tile is already taken', 'Warning', { status: 'warning' });
      return;
    }
    this.squares[idx] = this.playerValue;
    this.xIsNext = !this.xIsNext;
    const result = calculateWinner(this.squares);
    this.winner = result.winner;
    this.winningLine = result.line || [];
    if (this.winner === 'X') {
      this.player1Count++;
    } else if (this.winner === 'O') {
      this.player2Count++;
    }
  }

  private shouldConfirmLeave(): boolean {
    return this.playerCheck && !this.gameOver && this.squares.some((s) => s !== null);
  }
}
