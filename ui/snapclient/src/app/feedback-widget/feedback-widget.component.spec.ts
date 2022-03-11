import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FeedbackWidgetComponent} from './feedback-widget.component';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

describe('FeedbackWidgetComponent', () => {
  let component: FeedbackWidgetComponent;
  let fixture: ComponentFixture<FeedbackWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackWidgetComponent],
      providers: [{provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: MatDialogRef, useValue: {}}]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
