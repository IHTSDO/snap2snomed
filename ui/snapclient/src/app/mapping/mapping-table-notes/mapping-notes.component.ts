/*
 * Copyright © 2022-23 SNOMED International
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

import { Component, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import { Note, NoteCategory } from 'src/app/_models/note';
import { MapService, NoteResults } from 'src/app/_services/map.service';

import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-mapping-notes',
  templateUrl: './mapping-notes.component.html',
  styleUrls: ['./mapping-notes.component.css']
})
export class MappingNotesComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  sourceDisplayForHeading: string | undefined;
  notes: Note[] = [];

  @ViewChild(MatTable) table: MatTable<any> | undefined;

  displayedColumns: string[] = ['dateTime', 'noteBy', 'noteText'];
  dataSource = new MatTableDataSource(this.notes);

  showTable: boolean = false;

  constructor(
    private mapService: MapService,
    public dialogRef: MatDialogRef<MappingNotesComponent>,
       @Inject(MAT_DIALOG_DATA) public data: any) {  
  }

  ngOnInit(): void {
    this.sourceDisplayForHeading = this.data.sourceCode + ' (' + this.data.sourceDisplay + ')';
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotes(): void {
    const self = this;

    if (this.data.rowId) {
      this.mapService.getNotesByMapRow(this.data.rowId, NoteCategory.USER).subscribe((results: NoteResults) => {
          self.notes = results._embedded.notes.map((note) => {
            note.noteBy.givenName = note.noteBy.givenName ?? '';
            note.noteBy.familyName = note.noteBy.familyName ?? '';
            return note;
        });
        self.notes.sort((a, b) => self.sortNotes(a, b));
      })
      this.table?.renderRows();
    }

  }

  // Sort by created desc
  sortNotes(a: Note, b: Note): number {
    if (a.created && b.created) {
      if (a.created > b.created) {
        return -1;
      }
      if (a.created < b.created) {
        return 1;
      }
    }
    return 0;
  }

}
