import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { ResultsdialogComponent } from './resultsdialog.component';

describe('ResultsdialogComponent', () => {
  let component: ResultsdialogComponent;
  let fixture: ComponentFixture<ResultsdialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ 
        { provide: MatBottomSheetRef, useValue: {} },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} }
       ],
      declarations: [ ResultsdialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
