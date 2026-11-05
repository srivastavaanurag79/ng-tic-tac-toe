import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { AiComponent } from './ai.component';

describe('AiComponent', () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AiComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [{ provide: NbToastrService, useValue: { show: jasmine.createSpy('show') } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not let computer move after human wins', () => {
    component.playerCheck = true;
    component.player1 = 'Human';
    component.currentPlayer = component.human;
    component.squares = [
      ['O', 'O', ''],
      ['X', 'X', ''],
      ['', '', '']
    ];
    component.clickCount = 4;
    component.makeMove(0, 2);
    expect(component.winner).toBe('O');
    expect(component.squares[1][2]).toBe('');
  });
});
