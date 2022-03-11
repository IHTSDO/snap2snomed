import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptTermsComponent } from './accept-terms.component';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

describe('AcceptTermsComponent', () => {
  let component: AcceptTermsComponent;
  let fixture: ComponentFixture<AcceptTermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: MatDialogRef, useValue: {}}]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptTermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
