import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'app-ai',
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.css']
})
export class AiComponent implements OnInit {

  squares = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
  winner: string;
  playerCheck: boolean = false;
  startingPlayer: 'human' | 'computer' = 'computer';
  player1: string;
  player2: string = 'Computer';
  player1Count: number = 0;
  player2Count: number = 0;
  clickCount: number = 0;
  ai: 'X' | 'O';
  human: 'X' | 'O';
  currentPlayer: 'computer' | 'human';
  winnerName: string;
  gameOver: boolean = false;

  constructor(private toastrService: NbToastrService) { }

  ngOnInit() {
    this.resetGame();
  }

  submitPlayerData(form) {
    this.player1 = form.player1;
    this.playerCheck = true;
    this.currentPlayer = this.startingPlayer;
    if (this.startingPlayer === 'computer') {
      this.ai = 'X';
      this.human = 'O';
      this.bestMove();
    } else if (this.startingPlayer === 'human') {
      this.ai = 'O';
      this.human = 'X';
    }
  }

  resetGame() {
    this.squares = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.winner = null;
    this.player1Count = 0;
    this.player2Count = 0;
    this.clickCount = 0;
    this.player1 = '';
    this.player2 = 'Computer';
    this.playerCheck = false;
    this.gameOver = false;
  }

  newGame() {
    this.squares = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.winner = null;
    this.clickCount = 0;
    if (this.startingPlayer === 'computer') {
      this.bestMove();
    }
    if (this.startingPlayer === 'human') {
      this.currentPlayer === this.startingPlayer;
    }
    this.gameOver = false;
  }

  makeMove(idx: number, idy: number) {
    if (this.currentPlayer === 'human') {
      if (!this.squares[idx][idy]) {
        this.squares[idx][idy] = this.human;
        this.currentPlayer = 'computer';
        this.clickCount++;
      } else {
        this.toastrService.show('This tile is already taken', `Warning`, { status: 'warning' });
      }
    }
    if (this.clickCount < 9) {
      this.bestMove();
    }
    this.winner = this.checkWinner();
    if (this.winner === 'X' && this.ai === 'X') {
      this.player2Count++;
      this.winnerName = this.player2;
    } else if (this.winner === 'O' && this.ai === 'O') {
      this.player2Count++;
      this.winnerName = this.player2;
    } else if (this.winner === 'X' && this.human === 'X') {
      this.player1Count++;
      this.winnerName = this.player1;
    } else if (this.winner === 'O' && this.human === 'O') {
      this.player1Count++;
      this.winnerName = this.player1;
    }
    if (this.winner != null) {
      setTimeout(() => { this.gameOver = true; }, 400)
    }
  }

  equals3(a, b, c) {
    return a == b && b == c && a;
  }

  checkWinner() {
    let winner = null;
    // horizontal
    for (let i = 0; i < 3; i++) {
      if (this.equals3(this.squares[i][0], this.squares[i][1], this.squares[i][2])) {
        winner = this.squares[i][0];
      }
    }
    // Vertical
    for (let i = 0; i < 3; i++) {
      if (this.equals3(this.squares[0][i], this.squares[1][i], this.squares[2][i])) {
        winner = this.squares[0][i];
      }
    }
    // Diagonal
    if (this.equals3(this.squares[0][0], this.squares[1][1], this.squares[2][2])) {
      winner = this.squares[0][0];
    }
    if (this.equals3(this.squares[2][0], this.squares[1][1], this.squares[0][2])) {
      winner = this.squares[2][0];
    }

    let openSpots = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!this.squares[i][j]) {
          openSpots++;
        }
      }
    }

    if (winner === null && openSpots === 0) {
      return 'tie';
    } else {
      return winner;
    }
  }

  bestMove() {
    // AI to make its turn
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // Is the spot available?
        if (!this.squares[i][j]) {
          this.squares[i][j] = this.ai;
          let score = this.minimax(this.squares, 0, false);
          this.squares[i][j] = null;
          if (score > bestScore) {
            bestScore = score;
            move = { i, j };
          }
        }
      }
    }
    this.squares[move.i][move.j] = this.ai;
    this.clickCount++;
    this.currentPlayer = 'human';

  }

  scores = {
    X: 10,
    O: -10,
    tie: 0
  };

  minimax(board, depth, isMaximizing) {
    let result = this.checkWinner();
    if (result !== null) {
      return this.scores[result];
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          // Is the spot available?
          if (!board[i][j]) {
            board[i][j] = this.ai;
            let score = this.minimax(board, depth + 1, false);
            board[i][j] = null;
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          // Is the spot available?
          if (!board[i][j]) {
            board[i][j] = this.human;
            let score = this.minimax(board, depth + 1, true);
            board[i][j] = null;
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }

}
