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
