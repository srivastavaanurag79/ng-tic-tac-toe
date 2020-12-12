import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  squares: any[];
  xIsNext: boolean;
  winner: string;
  drawCheck: number;
  playerCheck: boolean = false;
  player1: string;
  player2: string;
  player1Count: number = 0;
  player2Count: number = 0;

  constructor(private toastrService: NbToastrService) { }

  ngOnInit() {
    this.resetGame();
  }

  submitPlayerData(form) {
    this.player1 = form.player1;
    this.player2 = form.player2;
    this.playerCheck = true;
  }

  resetGame() {
    this.squares = Array(9).fill(null);
    this.winner = null;
    this.xIsNext = true;
    this.drawCheck = 0;
    this.player1Count = 0;
    this.player2Count = 0;
    this.player1 = '';
    this.player2 = '';
    this.playerCheck = false;
  }

  newGame() {
    this.squares = Array(9).fill(null);
    this.winner = null;
    this.xIsNext = true;
    this.drawCheck = 0;
    console.log(this.squares);
  }

  get player() {
    // return this.xIsNext ? 'X' : 'O';
    return this.xIsNext ? this.player1 : this.player2;
  }

  get playerValue() {
    return this.xIsNext ? 'X' : 'O';
  }

  makeMove(idx: number) {
    if (!this.squares[idx]) {
      this.squares.splice(idx, 1, this.playerValue);
      this.xIsNext = !this.xIsNext;
      this.drawCheck++;
    } else {
      this.toastrService.show('This tile is already taken', `Warning`, { status: 'warning' });
    }
    this.winner = this.calculateWinner();
    if (this.winner === 'X') {
      this.player1Count++;
    } else if (this.winner === 'O') {
      this.player2Count++;
    }
  }

  get gameOver() {
    if (this.winner != null) {
      return true;
    } else if (this.winner === null && this.drawCheck === 9) {
      return true;
    } else {
      return false
    }
  }

  calculateWinner() {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (this.squares[a] && this.squares[a] === this.squares[b] && this.squares[a] === this.squares[c]) {
        return this.squares[a];
      }
    }
    return null;
  }
}
