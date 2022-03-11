import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FooterComponent} from './footer.component';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {APP_CONFIG} from "../app.config";
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} }
      ],
      declarations: [FooterComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have footer links', () => {
    const el: DebugElement = fixture.debugElement.query(By.css('.footer-link'));
    const expectedLabel = 'Copyright 2022 SNOMED International';
    const expectedUrl = 'http://www.snomed.org';
    expect(el.nativeElement.textContent).toBe(expectedLabel);
    expect(el.nativeElement.getAttribute('href')).toBe(expectedUrl);
  });
});
