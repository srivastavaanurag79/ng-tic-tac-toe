import { Component } from '@angular/core';
import { Router } from '@angular/router';

type PlayerColor = 'Red' | 'Green' | 'Yellow' | 'Blue';

interface Player {
  name: string;
  color: PlayerColor;
  position: number;
  finished: boolean;
}

const TRACK_LENGTH = 20;

@Component({
  selector: 'app-ludo',
  templateUrl: './ludo.component.html',
  styleUrls: ['./ludo.component.css']
})
export class LudoComponent {
  setup = true;
  players: Player[] = [];
  currentIndex = 0;
  dice: number | null = null;
  message = 'Set up players to start Quick Ludo.';
  log: string[] = [];
  winner: Player | null = null;

  colors: PlayerColor[] = ['Red', 'Green', 'Yellow', 'Blue'];
  form = {
    p1: 'Player 1',
    p2: 'Player 2',
    c1: 'Red' as PlayerColor,
    c2: 'Blue' as PlayerColor
  };

  constructor(private router: Router) { }

  home(): void {
    this.router.navigate(['/']);
  }

  start(form: { p1?: string; p2?: string; c1?: PlayerColor; c2?: PlayerColor }): void {
    const p1 = (form.p1 || this.form.p1 || 'Player 1').trim();
    const p2 = (form.p2 || this.form.p2 || 'Player 2').trim();
    const c1 = form.c1 || this.form.c1 || 'Red';
    const c2 = form.c2 || this.form.c2 || 'Blue';
    this.form = { p1, p2, c1, c2 };
    if (!p1 || !p2 || p1.toLowerCase() === p2.toLowerCase()) {
      this.message = 'Enter two different player names.';
      return;
    }
    if (c1 === c2) {
      this.message = 'Choose different colors.';
      return;
    }
    this.players = [
      { name: p1, color: c1, position: 0, finished: false },
      { name: p2, color: c2, position: 0, finished: false }
    ];
    this.currentIndex = 0;
    this.dice = null;
    this.winner = null;
    this.log = [];
    this.setup = false;
    this.message = `${this.current().name}, roll the dice.`;
  }

  reset(): void {
    this.setup = true;
    this.players = [];
    this.dice = null;
    this.winner = null;
    this.log = [];
    this.message = 'Set up players to start Quick Ludo.';
  }

  current(): Player {
    return this.players[this.currentIndex];
  }

  roll(): void {
    if (this.winner || !this.players.length) {
      return;
    }
    const player = this.current();
    this.dice = Math.floor(Math.random() * 6) + 1;
    const next = player.position + this.dice;
    if (next > TRACK_LENGTH) {
      this.message = `${player.name} rolled ${this.dice} and needs an exact roll to finish.`;
      this.addLog(`${player.name} rolled ${this.dice} (blocked).`);
    } else {
      player.position = next;
      this.addLog(`${player.name} rolled ${this.dice} to space ${player.position}/${TRACK_LENGTH}.`);
      if (player.position === TRACK_LENGTH) {
        player.finished = true;
        this.winner = player;
        this.message = `${player.name} reached home and won!`;
        return;
      }
      this.message = `${player.name} moved to ${player.position}. ${this.dice === 6 ? 'Roll again!' : ''}`;
    }
    if (this.dice !== 6) {
      this.currentIndex = (this.currentIndex + 1) % this.players.length;
      if (!this.winner) {
        this.message += ` ${this.current().name}'s turn.`;
      }
    }
  }

  track(player: Player): string[] {
    const cells = Array(TRACK_LENGTH + 1).fill('·');
    cells[0] = 'S';
    cells[TRACK_LENGTH] = 'H';
    cells[player.position] = player.color[0];
    return cells;
  }

  private addLog(entry: string): void {
    this.log = [entry, ...this.log].slice(0, 8);
  }
}
