import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DragService } from '../_services/drag.service';

export interface DraggableOptions {
  zones: string[];  // where this draggabke can be dragged to
  data?: any;       // the data that will be transfered
}

@Directive({
  selector: '[appDraggable]'
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
    const elem = document.createElement('span');
    elem.id = 'drag-ghost';
    elem.innerHTML = `${data.code} | ${data.display}`;
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
