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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MapRow} from '../../_models/map_row';
import {User} from '../../_models/user';
import {Note} from '../../_models/note';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {TranslateService} from '@ngx-translate/core';
import {MapService, NoteResults} from '../../_services/map.service';
import {SourceNavigationService} from '../../_services/source-navigation.service';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {Task} from '../../_models/task';
import {Subscription} from 'rxjs';
import {FormUtils} from '../../_utils/form_utils';
import {FormControl} from '@angular/forms';
import {DroppableEventObject} from "../../_directives/droppable.directive";

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css']
})
export class NotesListComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  @Input() task: Task | null = null;
  @ViewChild('text') formControl: FormControl | undefined;

  mapRow: MapRow | null = null;
  error: ErrorInfo = {};
  notes: Note[] = [];
  newNote: Note | null;
  MAX_NOTE = FormUtils.MAX_NOTE;
  VALID_STRING_PATTERN = FormUtils.VALID_STRING_PATTERN;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private mapService: MapService,
              private sourceNavigation: SourceNavigationService) {
    this.newNote = null;
  }

  // Sort by modified desc
  sortNotes(a: Note, b: Note): number {
    if (a.modified && b.modified) {
      if (a.modified > b.modified) {
        return -1;
      }
      if (a.modified < b.modified) {
        return 1;
      }
    }
    return 0;
  }

  ngOnInit(): void {
    const self = this;
    self.subscription.add(self.sourceNavigation.selectedRow$.subscribe((selectedRow) => {
      if (self.task?.mapping) {
        self.mapRow = selectedRow.mapRow?.convertToMapRow(self.task.mapping) ?? null;
        self.loadNotes();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotes(): void {
    const self = this;
    if (self.mapRow?.id) {
      self.newNote = new Note(null, '', new User(), '', '', self.mapRow);
      self.mapService.getNotesByMapRow(self.mapRow.id).subscribe((results: NoteResults) => {
        self.notes = results._embedded.notes.map((note) => {
          note.noteBy.givenName = note.noteBy.givenName ?? '';
          note.noteBy.familyName = note.noteBy.familyName ?? '';
          return note;
        });
        self.notes.sort((a, b) => self.sortNotes(a, b));
      });
    }
  }

  isValid(): boolean {
    if (this.newNote) {
      const validText = this.newNote.noteText.match(this.VALID_STRING_PATTERN);
      return validText !== null;
    }
    return false;
  }

  addNewNote(): void {
    const self = this;
    if (self.newNote && self.isValid()) {
      self.mapService.createNote(self.newNote).subscribe((result) => {
        self.loadNotes();
      });
    }
  }

  /**
   * Allow targets to be dropped into input
   * @param $event search target drag n drop
   */
  onDrop($event: DroppableEventObject): void {
    if (this.newNote && $event.data){
      this.newNote.noteText += `[${$event.data.code}] ${$event.data.display}`;
    }
  }
}
