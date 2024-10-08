import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DividendsComponent } from './dividends.component';

describe('DividendsComponent', () => {
  let component: DividendsComponent;
  let fixture: ComponentFixture<DividendsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividendsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DividendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
