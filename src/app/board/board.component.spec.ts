import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BoardComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [{ provide: NbToastrService, useValue: { show: jasmine.createSpy('show') } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject moves after a win', () => {
    component.playerCheck = true;
    component.player1 = 'A';
    component.player2 = 'B';
    component.xIsNext = true;
    component.makeMove(0);
    component.makeMove(3);
    component.makeMove(1);
    component.makeMove(4);
    component.makeMove(2);
    expect(component.winner).toBe('X');
    component.makeMove(5);
    expect(component.squares[5]).toBeNull();
  });

  it('should reject duplicate names', () => {
    component.submitPlayerData({ player1: 'Same', player2: 'same' });
    expect(component.playerCheck).toBeFalse();
  });
});
