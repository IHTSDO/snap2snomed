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

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DroppableDirective } from './droppable.directive';

@Component({
  template: `<div [appDroppable]="{zone: 'testZone'}">red green blue</div>`
})
class TestDroppableComponent {
}

describe('DroppableDirective', () => {

  let component: TestDroppableComponent;
  let fixture: ComponentFixture<TestDroppableComponent>;
  let inputEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DroppableDirective ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestDroppableComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('div'));
  });

  it('should create an instance', () => {
    inputEl.triggerEventHandler('dragenter', {target: inputEl.nativeElement});
    fixture.detectChanges()
    // expect(inputEl.nativeElement.style.backgroundColor).toBe('blue');  // FIXME
  });
});
