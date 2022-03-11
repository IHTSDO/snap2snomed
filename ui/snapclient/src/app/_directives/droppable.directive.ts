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

import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2} from '@angular/core';
import {DragService} from '../_services/drag.service';

export interface DroppableOptions {
  zone: string;
  data?: any;
}

export interface DroppableEventObject {
  zone: any;
  data: any;
}

@Directive({
  selector: '[appDroppable]'
})
export class DroppableDirective implements AfterViewInit, OnDestroy {

  // tslint:disable-next-line:ban-types
  private onDragEnter: Function = () => {
  }
  // tslint:disable-next-line:ban-types
  private onDragLeave: Function = () => {
  }
  // tslint:disable-next-line:ban-types
  private onDragOver: Function = () => {
  }
  // tslint:disable-next-line:ban-types
  private onDrop: Function = () => {
  }

  private counter = 0;  // used to deal with text nodes and nested elements

  public options: DroppableOptions = {
    zone: 'appZone'
  };

  // Allow options input by using [appDroppable]='{}'
  @Input()
  set appDroppable(options: DroppableOptions) {
    if (options) {
      this.options = options;
    }
  }

  @Input() dropDisabled = false;

  @Output() public onDroppableComplete: EventEmitter<DroppableEventObject> = new EventEmitter();

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2,
              private dragService: DragService) {
    this.renderer.addClass(this.elementRef.nativeElement, 'app-droppable');
  }

  ngAfterViewInit(): void {
    // Add available zone
    // This exposes the zone to the service so a draggable element can update it
    this.dragService.addAvailableZone(this.options.zone, {
      begin: () => {
        if (!this.dropDisabled) {
          this.renderer.addClass(this.elementRef.nativeElement, 'js-app-droppable--target');
        }
      },
      end: () => {
        this.renderer.removeClass(this.elementRef.nativeElement, 'js-app-droppable--target');
      }
    });
    this.addOnDragEvents();
  }

  ngOnDestroy(): void {
    // Remove zone
    this.dragService.removeAvailableZone(this.options.zone);

    // Remove events
    this.onDragEnter();
    this.onDragLeave();
    this.onDragOver();
    this.onDrop();
  }

  private addOnDragEvents(): void {
    if (!this.dropDisabled) {
      this.onDragEnter = this.renderer.listen(
        this.elementRef.nativeElement,
        'dragenter',
        (event: DragEvent) => this.handleDragEnter(event));
      this.onDragLeave = this.renderer.listen(
        this.elementRef.nativeElement,
        'dragleave',
        (event: DragEvent) => this.handleDragLeave(event));
      this.onDragOver = this.renderer.listen(
        this.elementRef.nativeElement,
        'dragover',
        (event: DragEvent) => this.handleDragOver(event));
      this.onDrop = this.renderer.listen(
        this.elementRef.nativeElement,
        'drop',
        (event: DragEvent) => this.handleDrop(event));
    }
  }

  private handleDragEnter(event: DragEvent): void {
    if (this.dragService.accepts(this.options.zone)) {
      // Prevent default to allow drop
      event.preventDefault();
      if (0 === this.counter) {
        if (!this.dropDisabled) {
          this.renderer.addClass(this.elementRef.nativeElement, 'js-app-droppable--zone');
        }
      }
      this.counter++;
    }
  }

  private handleDragLeave(event: DragEvent): void {
    if (this.dragService.accepts(this.options.zone)) {
      this.counter--;
      if (0 === this.counter) {
        this.renderer.removeClass(this.elementRef.nativeElement, 'js-app-droppable--zone');
      }
    }
  }

  private handleDragOver(event: DragEvent): void {
    if (this.dragService.accepts(this.options.zone)) {
      // Prevent default to allow drop
      event.preventDefault();
    }
  }

  private handleDrop(event: DragEvent): void {
    this.dragService.removeHighLightedAvailableZones();
    this.renderer.removeClass(this.elementRef.nativeElement, 'js-app-droppable--zone');
    this.counter = 0;

    // Prevent default to allow drop
    event.preventDefault();

    // Emit successful event
    const data = event.dataTransfer ? JSON.parse(event.dataTransfer.getData('Text')) : undefined;
    this.onDroppableComplete.emit({
      zone: this.options.data,
      data,
    });
  }

}
