import { ComponentFixture, TestBed } from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import { GravatarComponent } from './gravatar.component';

describe('GravatarComponent', () => {
  let component: GravatarComponent;
  let fixture: ComponentFixture<GravatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GravatarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GravatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display alt text', () => {
    component.alt='ML';
    component.updateGravatar();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div'));
    expect(el.nativeElement).toBeTruthy();
  })

  it('should display img', () => {
    component.alt='ML';
    component.updateGravatar('michael@lawley.id.au');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('img'));
    expect(el.nativeElement).toBeTruthy();
  })

});
