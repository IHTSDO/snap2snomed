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
import {Note, NoteCategory} from '../../_models/note';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {TranslateService} from '@ngx-translate/core';
import {MapService, NoteResults} from '../../_services/map.service';
import {SourceNavSet, SourceNavigationService} from '../../_services/source-navigation.service';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {Task} from '../../_models/task';
import {Subscription} from 'rxjs';
import {FormUtils} from '../../_utils/form_utils';
import {FormControl} from '@angular/forms';
import {DroppableEventObject} from "../../_directives/droppable.directive";
import {Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmDialogComponent, DialogType} from "../../dialog/confirm-dialog/confirm-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ErrorNotifier} from "../../errorhandler/errornotifier";

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css']
})
export class NotesListComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  @Input() currentUser: User | null = null;
  @Input() task: Task | null = null;
  @Input() sourceNavSet: SourceNavSet | null = null;
  @ViewChild('text') formControl: FormControl | undefined;

  mapRow: MapRow | null = null;
  error: ErrorInfo = {};
  notes: Note[] = [];
  systemNotes: Note[] = [];
  newNote: Note | null;
  MAX_NOTE = FormUtils.MAX_NOTE;
  VALID_STRING_PATTERN = FormUtils.VALID_STRING_PATTERN;

  // dialog
  confirm = '';
  cancel = '';
  confirmTitle = '';
  confirmMessage = '';

  constructor(private authService: AuthService,
              private errorNotifier: ErrorNotifier,
              private store: Store<IAppState>,
              private translate: TranslateService,
              private router: Router,
              private mapService: MapService,
              private sourceNavigation: SourceNavigationService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar) {
    this.newNote = null;
  }

  ngOnInit(): void {
    const self = this;
    self.subscription.add(self.sourceNavigation.selectedRow$.subscribe((selectedRow) => {
      if (self.task?.mapping) {
        self.mapRow = selectedRow.mapRow?.convertToMapRow(self.task.mapping) ?? null;
        self.loadNotes();
      }
    }));

    this.translate.get('DETAILS.DIALOG_NOTE_DELETE').subscribe((msg) => this.confirm = msg);
    this.translate.get('DETAILS.DIALOG_NOTE_CANCEL').subscribe((msg) => this.cancel = msg);
    this.translate.get('DETAILS.DIALOG_NOTE_TITLE').subscribe((msg) => this.confirmTitle = msg);
    this.translate.get('DETAILS.DIALOG_NOTE_CONFIRM').subscribe((msg) => this.confirmMessage = msg);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  addNewNote(): void {
    const self = this;
    if (self.newNote && self.isValid()) {
      self.mapService.createNote(self.newNote).subscribe((result) => {
          self.loadNotes();
        },
        error => {
          // error will occur when user's permissions have changed, or attempting to save note to project that has been deleted.
          this.router.navigate([''], {replaceUrl: true, state: {error: error.error}});
        });
    }
  }

  canDelete(note: Note): boolean {
    const owners = this.task?.mapping.project.owners;
    const isOwner = owners?.filter((u) => u.id === this.currentUser?.id).length ? owners?.filter((u) => u.id === this.currentUser?.id).length > 0 : false;
    return this.authService.isAdmin() || isOwner || note.noteBy.id === this.currentUser?.id;
  }

  deleteNote(note: Note): void {
    const self = this;
    const confirmDialogRef = self.dialog.open(ConfirmDialogComponent, {
      data: {
        title: self.confirmTitle,
        message: self.confirmMessage,
        button: self.confirm,
        cancel: self.cancel,
        type: DialogType.CONFIRM
      }
    });
    confirmDialogRef.afterClosed().subscribe(
      ok => {
        if (ok) {
          self.mapService.deleteNote(note).subscribe(result => {
              self.loadNotes();
            },
            error => {
              if (error.error.detail) {
                this.errorNotifier.showError(`Error encountered while attempting to delete note: ${error.error.detail}`)
              }
            }
          );
        }
      }
    );
  }

  loadNotes(): void {
    const self = this;
    if (self.mapRow?.id) {
      self.newNote = new Note(null, '', new User(), '', '', self.mapRow, NoteCategory.USER);

      // user notes
      self.mapService.getNotesByMapRow(self.mapRow.id, NoteCategory.USER).subscribe((results: NoteResults) => {
        self.notes = results._embedded.notes.map((note) => {
          note.noteBy.givenName = note.noteBy.givenName ?? '';
          note.noteBy.familyName = note.noteBy.familyName ?? '';
          return note;
        });
        if (this.sourceNavSet?.siblingRow) {
          self.mapService.getNotesByMapRow(this.sourceNavSet?.siblingRow?.rowId, NoteCategory.USER).subscribe((results: NoteResults) => {
            let siblingNotes = results._embedded.notes.map((note) => {
              note.noteBy.givenName = note.noteBy.givenName ?? '';
              note.noteBy.familyName = note.noteBy.familyName ?? '';
              return note;
            });
            self.notes = self.notes.concat(siblingNotes);
          })
        }
        self.notes.sort((a, b) => self.sortNotes(a, b));
      });

      // system notes
      self.mapService.getNotesByMapRow(self.mapRow.id, NoteCategory.STATUS).subscribe((results: NoteResults) => {
        self.systemNotes = results._embedded.notes.map((note) => {
          note.noteBy.givenName = '';
          note.noteBy.familyName = '';
          note.noteBy.id = '';
          return note;
        });
        if (this.sourceNavSet?.siblingRow) {
          self.mapService.getNotesByMapRow(this.sourceNavSet?.siblingRow?.rowId, NoteCategory.STATUS).subscribe((results: NoteResults) => {
            let siblingNotes = results._embedded.notes.map((note) => {
              note.noteBy.givenName = '';
              note.noteBy.familyName = '';
              note.noteBy.id = '';
              return note;
            });
            self.systemNotes = self.systemNotes.concat(siblingNotes);
          })
        }
        self.systemNotes.sort((a, b) => self.sortNotes(a, b));
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

  /**
   * Allow targets to be dropped into input
   * @param $event search target drag n drop
   */
  onDrop($event: DroppableEventObject): void {
    if (this.newNote && $event.data){
      this.newNote.noteText += `[${$event.data.code}] ${$event.data.display}`;
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
