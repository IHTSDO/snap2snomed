/**  Copyright 2019 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license
    
    Written By: "Debasis Panda"
    https://medium.com/@imdebasispanda/resize-table-column-angular-5cb58b67367

    Modified 2022 SNOMED International
 */

/**
 * This Component adds broswer agnostic column resizing to mat-table.
 * Standard HTML resize for columns does not play nicely with our table for many reasons.
 *  - needs to be in its own DIV for firefox
 *  - we also have sort in its own div .. an extra complexity making them work well together .. and consistently across browser
 *  - divs are difficult to make expand to take up the available room consistently across browsers
 *  - resize handle can disappear permanently
 *  - resize of column header doesn't resize the TD cells
 * 
 * Usage: In <TH>
 *  e.g. <th mat-header-cell *matHeaderCellDef [resizeColumn]="true" [index]="2" [title]="'TABLE.SOURCE_DISPLAY' | translate">
 * 
 */
import { OnInit, Renderer2, Input, ElementRef, Component, ViewEncapsulation } from "@angular/core";

@Component({
    selector: "[resizeColumn]",
    template: '<div mat-sort-header>{{title}}</div>',
    styleUrls: ['./resize-column.component.css'],
    encapsulation: ViewEncapsulation.None // Tell Angular to not scope your styles
    ,
    standalone: false
})
export class ResizeColumnComponent implements OnInit {
  
  @Input("resizeColumn") resizable: boolean | undefined;
  @Input() index: number | undefined;
  @Input() title: string | undefined;
  private startX: number | undefined;
  private startWidth: number | undefined;
  private column: HTMLElement;
  private table: HTMLElement | undefined;
  private pressed: boolean | undefined;

  constructor(private renderer: Renderer2, private el: ElementRef) {
    this.column = this.el.nativeElement;
  }

  ngOnInit() {
    if (this.resizable) {
      const row = this.renderer.parentNode(this.column);
      const thead = this.renderer.parentNode(row);
      this.table = this.renderer.parentNode(thead);

      const resizer = this.renderer.createElement("span");
      this.renderer.addClass(resizer, "triangle-bottomright");
      this.renderer.appendChild(this.column, resizer);
      this.renderer.listen(resizer, "mousedown", this.onMouseDown);
      this.renderer.listen(this.table, "mousemove", this.onMouseMove);
      this.renderer.listen("document", "mouseup", this.onMouseUp);
    }
  }

  onMouseDown = (event: MouseEvent) => {
    this.pressed = true;
    this.startX = event.pageX;
    this.startWidth = this.column.offsetWidth;
  };

  onMouseMove = (event: MouseEvent) => {
    const offset = 35;
    if (this.pressed && event.buttons) {
      this.renderer.addClass(this.table, "resizing");

      // Calculate width of column
      if (this.startWidth && this.startX && this.table) {
        let width =
        this.startWidth + (event.pageX - this.startX - offset);

        const tableCells = Array.from(this.table.querySelectorAll(".mat-row")).map(
            (row: any) => row.querySelectorAll(".mat-cell").item(this.index)
          );
    
          // Set table header width
          this.renderer.setStyle(this.column, "width", `${width}px`);
    
          // Set table cells width
          for (const cell of tableCells) {
            this.renderer.setStyle(cell, "width", `${width}px`);
          }
      }
    }
  };

  onMouseUp = (event: MouseEvent) => {
    if (this.pressed) {
      this.pressed = false;
      this.renderer.removeClass(this.table, "resizing");
    }
  };
}
