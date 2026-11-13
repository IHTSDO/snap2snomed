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

import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MapView } from '../_models/map_row';
import { DragService } from '../_services/drag.service';

export interface DraggableOptions {
  zones: string[];  // where this draggabke can be dragged to
  data?: any;       // the data that will be transfered
}

@Directive({
    selector: '[appDraggable]',
    standalone: false
})
export class DraggableDirective implements OnInit, OnDestroy {

  // Events
  private onDragStart: Function = () => {};
  private onDragEnd: Function = () => {};

  // Options for the directive
  private options?: DraggableOptions;

  @Input()
  set appDraggable(options: DraggableOptions) {
    if (options) {
      this.options = options;
    }
  }

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private dragService: DragService) {
  }

  ngOnInit(): void {
    this.addDragEvents();
  }

  ngOnDestroy(): void {
    this.onDragStart();
    this.onDragEnd();
  }

  private ghostImage(data: any): Element {

    const DRAG_GHOST_ELEM_ID = 'drag-ghost';
    
    // prevent ghosting of previous drags 
    const existingElem = document.getElementById(DRAG_GHOST_ELEM_ID);
    if (existingElem) {
      document.body.removeChild(existingElem);
    }

    const elem = document.createElement('span');
    elem.id = DRAG_GHOST_ELEM_ID;
    if (typeof data === 'string') {
      elem.innerHTML = `${data}`;
    }
    else if (data instanceof MapView) {
      elem.innerHTML = `${data.targetCode} | ${data.targetDisplay}`;
    }
    else {
      elem.innerHTML = `${data.code} | ${data.display}`;
    }
    elem.style.position = 'absolute';
    elem.style.top = '-1000px';
    document.body.appendChild(elem);
    return elem;
  }

  /**
   * @desc responsible for adding the drag events to the directive
   * @note transfers drag data using the Drag and Drop API (Browser)
   * @note known CSS issue where a draggable element cursor cant be set while dragging in Chrome
   */
  private addDragEvents(): void {
    this.renderer.setProperty(this.elementRef.nativeElement, 'draggable', true);

    this.onDragStart = this.renderer.listen(
      this.elementRef.nativeElement,
      'dragstart',
      (event: DragEvent): void => {
        if (this.options) {
          this.dragService.startDrag(this.options.zones);
          // Transfer the data using Drag and Drop API (Browser)
          event.dataTransfer?.setDragImage(this.ghostImage(this.options.data), -14, 8);
          event?.dataTransfer?.setData('Text', JSON.stringify(this.options.data));
        }
      });

    this.onDragEnd = this.renderer.listen(
      this.elementRef.nativeElement,
      'dragend',
      (event: DragEvent): void => {
        this.dragService.removeHighLightedAvailableZones();

        const ghost = document.getElementById('drag-ghost');
        if (ghost?.parentNode) {
          ghost.parentNode.removeChild(ghost);
        }
      });
  }
}
