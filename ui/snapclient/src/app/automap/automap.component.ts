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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AutomapDialogComponent} from './automap-dialog.component';
import {AutomapRow, MapService} from '../_services/map.service';
import {MapRowRelationship, MapRowStatus, MapView} from '../_models/map_row';
import {forkJoin, from, Observable, of} from 'rxjs';
import {DEFAULT, FhirService} from '../_services/fhir.service';
import {catchError, concatMap, map, mergeMap, tap} from 'rxjs/operators';
import {TargetRow} from '../_models/target_row';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {Mapping} from '../_models/mapping';

@Component({
  selector: 'app-automap',
  templateUrl: './automap.component.html',
  styleUrls: ['./automap.component.css']
})
export class AutomapComponent implements OnInit {
  automapDialog: MatDialogRef<AutomapDialogComponent> | null = null;
  automapping = false;
  automapCount = 0;
  automapDialogTitle = '';
  automapDialogMessage = '';
  automapDialogOK = '';
  automapDialogCancel = '';
  automapDialogError: any | null = null;
  @Input() mapping: Mapping | undefined;
  @Input() task_id: any = null;
  @Input() data: MapView[] = [];
  @Output() automapPercentEvent = new EventEmitter<number>();
  @Output() updateTableEvent = new EventEmitter();

  constructor(private dialog: MatDialog,
              private translate: TranslateService,
              private fhirService: FhirService,
              private mapService: MapService) {
    this.translate.get(['AUTOMAP.AUTOMAP', 'AUTOMAP.AUTOMAP_RUNNING', 'DIALOG.OK', 'DIALOG.CANCEL']).subscribe((labels) => {
      this.automapDialogTitle = labels['AUTOMAP.AUTOMAP'];
      this.automapDialogMessage = labels['AUTOMAP.AUTOMAP_RUNNING'];
      this.automapDialogOK = labels['DIALOG.OK'];
      this.automapDialogCancel = labels['DIALOG.CANCEL'];
    });
  }

  ngOnInit(): void {
    this.startAutomap();
  }

  private startAutomap(): void {
    const self = this;
    self.automapping = true;
    self.automapDialog = self.dialog.open(AutomapDialogComponent, {
      width: '450px',
      height: '200px',
      data: {
        title: self.automapDialogTitle,
        message: self.automapDialogMessage,
        button: self.automapDialogOK,
        cancel: self.automapDialogCancel,
        error: null,
        automapPercent: self.automapPercentEvent
      },
      disableClose: true,
      hasBackdrop: true,
    });

    self.automapDialog.afterClosed().subscribe(
      (result: boolean) => {
        self.finishAutomap();
        self.updateTableEvent.emit();
      });
    // Start
    self.automap();
  }

  private finishAutomap(): void {
    const self = this;
    self.automapping = false;
  }

  automap(): void {
    const self = this;

    if (!self.task_id || !self.mapping?.toScope || !self.mapping.toVersion) {
      return;
    }
    const scope = self.mapping?.toScope;
    const version: string = self.mapping.toVersion;

    self.mapService.getTaskAuthorRows(self.task_id).subscribe(
      (rows: AutomapRow[]) => {
        self.automapCount = 0;
        if (rows.length === 0) {
          self.translate.get('AUTOMAP.NOROWS').subscribe((msg) => {
            if (self.automapDialog && self.automapDialog.componentInstance) {
              self.automapDialog.componentInstance.data = {
                ...self.automapDialog.componentInstance.data,
                error: msg
              };
            }
          });
          self.automapping = false;
          return;
        }
        const mapViewIndex: { [key: string]: MapView } = {};
        self.data?.forEach(mv => {
          mapViewIndex[mv.rowId] = mv;
        });

        // We want up to 20 threads with max k pieces of work
        const k = Math.ceil(rows.length / 20);
        const chunks: any[] = [];

        for (let i = 0; i < rows.length / k; i++) {
          const start = i * k;
          const chunk = rows.slice(start, start + k);
          chunks.push(chunk);
        }

        const context = {
          matchCount: 0,
          fhirErrors: 0,
          backendErrors: 0,
          total: rows.length,
          version,
          scope,
          mapViewIndex,
        };

        forkJoin(chunks.map((chunk, id) => this.automapRows(chunk, id, context)
        )).subscribe(
          () => {
            self.translate.get(['AUTOMAP.AUTOMAP_COMPLETED', 'AUTOMAP.AUTOMAP_ERRORS'], {
              matches: context.matchCount,
              total: rows.length,
              errorCount: context.fhirErrors + context.backendErrors,
            }).subscribe(msgs => {
              if (self.automapDialog && self.automapDialog.componentInstance) {
                const errormsg = (context.fhirErrors || context.backendErrors) ? ` ${msgs['AUTOMAP.AUTOMAP_ERRORS']}` : null;
                self.automapDialog.componentInstance.data = {
                  ...self.automapDialog.componentInstance.data,
                  message: msgs['AUTOMAP.AUTOMAP_COMPLETED'],
                  error: errormsg,
                };
              }
            });
          },
          (error) => {
            console.log('Automap rows Error:', error);
            throw error;
          },
          () => {
            self.finishAutomap();
          }
        );
      },
      (error) => {
        console.error('Automap Error: ', error);
        self.translate.get('AUTOMAP.AUTOMAP_FAILURE').subscribe(msg => {
          if (self.automapDialog && self.automapDialog.componentInstance) {
            self.automapDialog.componentInstance.data = {
              ...self.automapDialog.componentInstance.data,
              error: msg !== 0 ? msg.toString() : null
            };
          }
        });
      }
    );
  }

  automapRows(rows: AutomapRow[], id: number, context: {
    version: string,
    scope: string,
    total: number,
    matchCount: number,
    fhirErrors: number,
    backendErrors: number,
    mapViewIndex: { [key: string]: MapView },
  }): Observable<any> {
    const self = this;

    const mapRow: ((row: AutomapRow, i: number) => Observable<any>) = (row, i) => {
      const rowId = '' + row.id;
      const mapView: MapView | undefined = context.mapViewIndex[rowId];

      if (!self.automapping) {
        return of(null);
      }

      return self.fhirService.autoSuggest(row.display, context.version, context.scope, DEFAULT, true, 1, true).pipe(
        map(matches => matches[0]),
        mergeMap(match => {
          if (match) {
            const targetRow: TargetRow = {
              row: rowId,
              targetCode: match.code,
              targetDisplay: match.display,
              relationship: MapRowRelationship.INEXACT,
            };
            if (!self.automapping) {
              return of(null);
            }
            return self.mapService.createTarget(targetRow).pipe(
              tap((result: TargetRow) => {
                context.matchCount++;
                if (mapView) {
                  // It's in-view, so update local copy for visual feedback
                  mapView.updateFromTarget(result);
                  mapView.updateStatus(MapRowStatus.DRAFT);
                }
              }),
              catchError(error => {
                console.error('Autosuggest Target Update Error:', row.display, error);
                context.backendErrors++;
                return of(null);
              })
            );
          } else {
            return of(null);
          }
        }),
        tap(() => {
          self.automapCount += 100;
          self.automapPercentEvent.emit(self.automapCount / context.total);
        }),
        catchError(error => {
          console.log('Autosuggest Error:', row.display, error);
          context.fhirErrors++;
          return of(null);
        })
      );
    };
    if (!self.automapping) {
      return of(null);
    }
    return from(rows).pipe(
      concatMap(mapRow)
    );
  }

}
