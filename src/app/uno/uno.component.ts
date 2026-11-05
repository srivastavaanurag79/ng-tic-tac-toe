import { Component } from '@angular/core';
import { Router } from '@angular/router';

type UnoColor = 'Red' | 'Green' | 'Blue' | 'Yellow';
type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Skip' | 'Reverse';
interface UnoCard { color: UnoColor; value: UnoValue; id: number; }

const COLORS: UnoColor[] = ['Red', 'Green', 'Blue', 'Yellow'];
const VALUES: UnoValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse'];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Component({
  selector: 'app-uno',
  templateUrl: './uno.component.html',
  styleUrls: ['./uno.component.css']
})
export class UnoComponent {
  setup = true;
  playerName = 'You';
  botName = 'Bot';
  deck: UnoCard[] = [];
  discard: UnoCard[] = [];
  playerHand: UnoCard[] = [];
  botHand: UnoCard[] = [];
  current: 'player' | 'bot' = 'player';
  message = 'Set up to start Quick Uno.';
  winner: string | null = null;
  nextId = 1;
  busy = false;

  constructor(private router: Router) { }

  home(): void {
    this.router.navigate(['/']);
  }

  start(form: { playerName?: string }): void {
    this.playerName = (form.playerName || 'You').trim() || 'You';
    this.newRound();
  }

  reset(): void {
    this.setup = true;
    this.winner = null;
    this.message = 'Set up to start Quick Uno.';
  }

  newRound(): void {
    this.setup = false;
    this.winner = null;
    this.busy = false;
    this.nextId = 1;
    const cards: UnoCard[] = [];
    for (const color of COLORS) {
      for (const value of VALUES) {
        cards.push({ color, value, id: this.nextId++ });
      }
    }
    this.deck = shuffle(cards);
    this.playerHand = this.draw(7);
    this.botHand = this.draw(7);
    let top = this.draw(1)[0];
    while (top && (top.value === 'Skip' || top.value === 'Reverse')) {
      this.deck.push(top);
      this.deck = shuffle(this.deck);
      top = this.draw(1)[0];
    }
    this.discard = top ? [top] : [];
    this.current = 'player';
    this.message = `${this.playerName}'s turn. Match color or value.`;
  }

  top(): UnoCard | undefined {
    return this.discard[this.discard.length - 1];
  }

  canPlay(card: UnoCard): boolean {
    const top = this.top();
    return !!top && (card.color === top.color || card.value === top.value);
  }

  play(card: UnoCard): void {
    if (this.busy || this.winner || this.current !== 'player' || !this.canPlay(card)) {
      return;
    }
    this.playerHand = this.playerHand.filter((c) => c.id !== card.id);
    this.discard.push(card);
    if (this.checkWinner()) {
      return;
    }
    if (card.value === 'Skip' || card.value === 'Reverse') {
      this.message = `${this.playerName} played ${card.color} ${card.value}. Go again!`;
      return;
    }
    this.current = 'bot';
    this.message = `Bot is thinking...`;
    this.busy = true;
    setTimeout(() => this.botTurn(), 550);
  }

  drawCard(): void {
    if (this.busy || this.winner || this.current !== 'player') {
      return;
    }
    const card = this.draw(1)[0];
    if (!card) {
      this.message = 'No cards left to draw.';
      return;
    }
    this.playerHand.push(card);
    if (this.canPlay(card)) {
      this.message = `You drew ${card.color} ${card.value}. You can play it.`;
      return;
    }
    this.current = 'bot';
    this.message = `You drew ${card.color} ${card.value}. Bot's turn.`;
    this.busy = true;
    setTimeout(() => this.botTurn(), 550);
  }

  private botTurn(): void {
    if (this.winner) {
      this.busy = false;
      return;
    }
    const playable = this.botHand.find((c) => this.canPlay(c));
    if (playable) {
      this.botHand = this.botHand.filter((c) => c.id !== playable.id);
      this.discard.push(playable);
      if (this.checkWinner()) {
        this.busy = false;
        return;
      }
      if (playable.value === 'Skip' || playable.value === 'Reverse') {
        this.message = `Bot played ${playable.color} ${playable.value} and goes again.`;
        setTimeout(() => this.botTurn(), 550);
        return;
      }
      this.message = `Bot played ${playable.color} ${playable.value}. Your turn.`;
    } else {
      const card = this.draw(1)[0];
      if (card) {
        this.botHand.push(card);
        this.message = `Bot drew a card. Your turn.`;
      } else {
        this.message = `Bot could not draw. Your turn.`;
      }
    }
    this.current = 'player';
    this.busy = false;
  }

  private checkWinner(): boolean {
    if (!this.playerHand.length) {
      this.winner = this.playerName;
      this.message = `${this.playerName} wins!`;
      return true;
    }
    if (!this.botHand.length) {
      this.winner = this.botName;
      this.message = `${this.botName} wins!`;
      return true;
    }
    return false;
  }

  private draw(count: number): UnoCard[] {
    const drawn: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      if (!this.deck.length) {
        this.recycleDiscard();
      }
      const card = this.deck.pop();
      if (card) {
        drawn.push(card);
      }
    }
    return drawn;
  }

  private recycleDiscard(): void {
    const top = this.discard.pop();
    this.deck = shuffle(this.discard);
    this.discard = top ? [top] : [];
  }
}
