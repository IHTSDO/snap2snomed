/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
