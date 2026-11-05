import { Component, Input } from '@angular/core';
import { Cell } from '../shared/tic-tac-toe';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.css']
})
export class SquareComponent {
  @Input() value: Cell = null;
  @Input() winner: Cell | 'tie' | null = null;
  @Input() disabled = false;
  @Input() highlight = false;
  @Input() ariaLabel = 'Board cell';
}
