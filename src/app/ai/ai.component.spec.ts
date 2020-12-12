import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AiComponent } from './ai.component';

describe('AiComponent', () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
