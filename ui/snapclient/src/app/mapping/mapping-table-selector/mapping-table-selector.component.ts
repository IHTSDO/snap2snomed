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

import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { IAppState } from '../../../app/store/app.state';
import { SelectMapRow } from '../../../app/store/mapping-feature/mapping.actions';
import { selectCurrentView, selectSelectedRows } from '../../../app/store/mapping-feature/mapping.selectors';
import { MappedRowDetailsDto, MapView, Page } from '../../../app/_models/map_row';

@Component({
  selector: 'app-mapping-table-selector',
  templateUrl: './mapping-table-selector.component.html',
  styleUrls: ['./mapping-table-selector.component.css']
})
export class MappingTableSelectorComponent implements OnInit, OnDestroy, AfterViewInit {

  // @ts-ignore
  @ViewChild(MatColumnDef) columnDef: MatColumnDef;

  private subscription = new Subscription();
  // tslint:disable-next-line:variable-name
  private _name = 'id';

  @Input() allSourceDetails: MappedRowDetailsDto[] = [];
  @Input() page: Page = new Page();
  @Input()
  get name(): string { return this._name; }
  set name(name: string) {
      this._name = name;
      if (this.columnDef) {
        this.columnDef.name = name;
      }
  }
  selectedRows: MappedRowDetailsDto[] = [];

  isAllSelected = false;
  isPageSelected = false;
  isAnySelected = false;
  lastSelected = 0;

  // This is the setup to have our columnDef as part of a parent table
  constructor(
    @Optional() public table: MatTable<any>,
    public cdRef: ChangeDetectorRef,
    private store: Store<IAppState>) { }

  ngOnInit(): void {
    const self = this;
    if (this.table) {
      this.cdRef.detectChanges();
      this.table.addColumnDef(this.columnDef);
    }
    self.subscription.add(self.store.select(selectSelectedRows).subscribe(
      (selectedRows) => {
        self.selectedRows = selectedRows;
      })
    );
    self.subscription.add(self.store.select(selectCurrentView).subscribe(
      (mapping) => {
        if (mapping) {
          // Page changed
          this.page = mapping;
          this.ngAfterViewInit();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.isAnySelected = false;
    if (this.selectedRows && this.selectedRows.length > 0 && this.selectedRows.length === this.allSourceDetails.length) {
      this.isAllSelected = true;
      this.isAnySelected = true;
    }
    let foundOnPage = 0;
    this.page.data.forEach(row => {
      if (this.isSelectedPageRow(row.rowId, row.targetId, row.sourceIndex)) {
        foundOnPage += 1;
      }
    });
    if (foundOnPage === this.page.data.length) {
      this.isPageSelected = true;
      this.isAnySelected = true;
    } else if (foundOnPage === 0) {
      this.isPageSelected = false;
    } else {
      this.isAnySelected = true;
    }
  }

  ngOnDestroy(): void {
    this.clearAllSelectedRows();
    this.subscription.unsubscribe();
  }

  isSelectionFocus(idx: number): boolean {
    if (this.page) {
      return this.lastSelected === idx;
    }
    return false;
  }

  shiftKeySelect($event: MouseEvent, end: any): void {
    if (this.page && $event.shiftKey) {
      let endIdx = this.page.data.indexOf(end);

      if (this.lastSelected < endIdx) {
        if (window.navigator.userAgent.indexOf('Firefox') >= 0) {
          endIdx++;
        }
        for (let i = this.lastSelected; i < endIdx; i++) {
          this.pushSelection(
              parseInt(this.page.data[i].rowId!),
              this.page.data[i].targetId ? parseInt(this.page.data[i].targetId!) : null,
              parseInt(this.page.data[i].sourceIndex));
        }
      } else if (endIdx < this.lastSelected) {
        if (window.navigator.userAgent.indexOf('Firefox') >= 0) {
          endIdx--;
        }
        for (let i = this.lastSelected; i > endIdx; i--) {
          this.pushSelection(
              parseInt(this.page.data[i].rowId!),
              this.page.data[i].targetId ? parseInt(this.page.data[i].targetId!) : null,
              parseInt(this.page.data[i].sourceIndex));
        }
      }
      this.store.dispatch(new SelectMapRow({selectedrows: this.selectedRows}));
    }
  }

  pushSelectionDto(selection: MappedRowDetailsDto): void {
    this.pushSelection(selection.mapRowId, selection.mapRowTargetId, selection.sourceIndex);
  }

  pushSelection(rowId: number, targetId: number | null | undefined, sourceIndex: number): void {
    const newSelectedRow = new MappedRowDetailsDto(
      rowId,
      targetId,
      sourceIndex);
    const existingIndex = this.selectedRows.findIndex(selection =>
        selection.mapRowId === newSelectedRow.mapRowId
        && selection.mapRowTargetId === newSelectedRow.mapRowTargetId);
    if (existingIndex < 0) {
      this.selectedRows.push(newSelectedRow);
    }
  }

  selectAllToggle(event: any): void {
    if (event.checked) {
      this.selectedRows = Object.assign([], this.allSourceDetails);
      this.isAllSelected = true;
      this.isAnySelected = true;
      this.lastSelected = 0;
      this.store.dispatch(new SelectMapRow({selectedrows: this.selectedRows}));
    } else {
      this.clearAllSelectedRows();
      this.isAllSelected = false;
      this.isAnySelected = false;
      this.lastSelected = 0;
      this.store.dispatch(new SelectMapRow({selectedrows: []}));
    }
    this.ngAfterViewInit();
  }

  selectPageToggle(event: any): void {
    if (event.checked) {
      this.page.data.forEach(row => {
        const newSelectedRow = new MappedRowDetailsDto(
          parseInt(row.rowId),
          row.targetId ? parseInt(row.targetId!) : null,
          parseInt(row.sourceIndex));
        this.pushSelectionDto(newSelectedRow);
      });
      this.isPageSelected = true;
      this.isAnySelected = true;
      this.store.dispatch(new SelectMapRow({selectedrows: this.selectedRows}));
    } else {
      this.page.data.forEach(row => {
        const newSelectedRow = new MappedRowDetailsDto(
          parseInt(row.rowId),
          row.targetId ? parseInt(row.targetId!) : null,
          parseInt(row.sourceIndex));
        this.clearSelectedRow(newSelectedRow);
      });
      this.isAllSelected = false;
      this.isPageSelected = false;
      this.isAnySelected = false;
      this.lastSelected = 0;
      this.store.dispatch(new SelectMapRow({selectedrows: this.selectedRows}));
    }
    this.ngAfterViewInit();
  }

  checkSelected(row: MapView): boolean {
    return this.selectedRows.filter(selectedRow =>
      selectedRow.sourceIndex === parseInt(row.sourceIndex)
      && selectedRow.mapRowTargetId === row.targetId).length > 0;
  }

  toggleSelection(event: any, row: MapView, index: number): void {
    const sourceIndex = parseInt(row.sourceIndex);
    const newSelectedRow = new MappedRowDetailsDto(
        parseInt(row.rowId),
        row.targetId ? parseInt(row.targetId!) : null,
        parseInt(row.sourceIndex));
    if (event.checked) {
      this.pushSelectionDto(newSelectedRow);
      this.lastSelected = index;
      this.isAnySelected = true;
    } else {
      this.isAllSelected = false;
      this.isPageSelected = false;
      const existingIndex = this.selectedRows.findIndex(selection =>
        selection.mapRowId === newSelectedRow.mapRowId
        && selection.mapRowTargetId === newSelectedRow.mapRowTargetId);
      if (existingIndex >= 0) {
          this.selectedRows.splice(existingIndex, 1);
      }
    }
    this.ngAfterViewInit();
    this.store.dispatch(new SelectMapRow({selectedrows: this.selectedRows}));
  }

  clearSelectedRow(selection: MappedRowDetailsDto): void {
    const existingIndex = this.selectedRows.findIndex(sel =>
      selection.mapRowId === sel.mapRowId
      && selection.mapRowTargetId === sel.mapRowTargetId);
    if (existingIndex >= 0) {
      this.selectedRows.splice(existingIndex, 1);
      this.isAllSelected = false;
      this.isPageSelected = false;
    }
  }

  clearAllSelectedRows(): void {
    this.selectedRows = [];
    this.isAllSelected = false;
    this.isPageSelected = false;
    this.store.dispatch(new SelectMapRow({selectedrows: []}));
  }

  isSelectedPageRow(rowId: string, targetId: string | null | undefined, sourceIndex: string): boolean {
    const existingIndex = this.selectedRows.findIndex(sel =>
      parseInt(rowId) === sel.mapRowId
      && targetId ? parseInt(targetId!) : null === sel.mapRowTargetId
      && parseInt(sourceIndex) === sel.sourceIndex);
    return existingIndex >= 0;
  }

  getSelectedRowsCount(): string {
    if (this.selectedRows) {
      if (this.selectedRows.length > 9999) {
        return '9999+';
      } else {
        return String(this.selectedRows.length);
      }
    }
    return '0';
  }

  isIndeterminateSelectAll(): boolean {
    if (this.selectedRows && this.selectedRows.length > 0 && !this.isAllSelected) {
      return true;
    }
    return false;
  }
}
