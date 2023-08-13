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
import {MapRowRelationship, mapRowRelationships, MapRowStatus, MapView, toMapRowStatus} from '../../_models/map_row';
import {MapService} from '../../_services/map.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DroppableEventObject} from '../../_directives/droppable.directive';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {SelectionService} from 'src/app/_services/selection.service';
import {Task} from 'src/app/_models/task';
import {StatusUtils} from '../../_utils/status_utils';
import {SourceRow} from '../mapping-detail/mapping-detail.component';
import {WriteDisableUtils} from "../../_utils/write_disable_utils";
import {FhirService} from "../../_services/fhir.service";
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app.state';
import { FindSuggestedReplacementConcepts } from 'src/app/store/fhir-feature/fhir.actions';
import { selectReplacementConceptsList } from 'src/app/store/fhir-feature/fhir.selectors';
import { IParameters } from '@ahryman40k/ts-fhir-types/lib/R4';

export interface Coding { //import from reducer?
  code: string;
  display: string;
}

@Component({
  selector: 'app-target-relationship',
  templateUrl: './target-relationship.component.html',
  styleUrls: ['./target-relationship.component.css']
})
export class TargetRelationshipComponent implements OnInit {
  relationships: MapRowRelationship[] = [];
  error: ErrorInfo = {};
  selectedSearchItem: any = null;
  @Input() task: Task | null = null;
  @Input() targetRows: Array<MapView> = new Array<MapView>();
  @Input() source: SourceRow | null = null;
  @Input() disableActions = false;
  @Input() disableFlagging = false;
  @Output() newTargetEvent = new EventEmitter<MapView>();
  @Output() removeTargetEvent = new EventEmitter<MapView>();
  @Output() noMapEvent = new EventEmitter<boolean>();
  @Output() flagEvent = new EventEmitter<MapView>();

  writeDisableUtils = WriteDisableUtils;
  toMapRowStatus = toMapRowStatus;

  sameAsConcepts: Coding[] = [];
  replacedByConcepts: Coding[] = [];
  alternativeConcepts: Coding[] = [];
  possiblyEquivalentToConcepts: Coding[] = [];

  private subscription = new Subscription();

  constructor(private mapService: MapService,
              private fhirService: FhirService,
              private router: Router,
              private selectionService: SelectionService,
              private translate: TranslateService,
              private store: Store<IAppState>) {
    this.relationships = mapRowRelationships;
  }

  ngOnInit(): void {
    const self = this;
    self.selectionService.subscribe({
      next: (value: any) => {
        self.selectedSearchItem = value;
      }
    });

    
    self.subscription.add(self.store.select(selectReplacementConceptsList).subscribe(
      (parameters) => {

        // guard against multiple notifications        
        this.sameAsConcepts = []; 
        this.replacedByConcepts = [];
        this.possiblyEquivalentToConcepts = [];
        this.alternativeConcepts = [];

        if (parameters) {
          //TODO fix up code below
          if (parameters.sameAs) {
            this.sameAsConcepts = this.updateReplacements(parameters.sameAs);
            console.log("this.sameAsConcepts" + this.sameAsConcepts);
            if (this.sameAsConcepts.length > 0) {
              let rowId = "1";
              let sourceIndex = "1";
              let sourceCode = "1";
              let sourceDisplay = "diaply";
              let targetCode = this.sameAsConcepts[0].code;
              let targetDisplay = this.sameAsConcepts[0].display;
              let relationship = MapRowRelationship.INEXACT;
              let status = MapRowStatus.DRAFT;
              let noMap = false;
              let flagged = true;
              let tags = ["replacement"];
              this.targetRows.push(new MapView(rowId, undefined, sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, 
                relationship, status, noMap, undefined, undefined, undefined, undefined, undefined, flagged, undefined, tags, undefined))
            }
          }
          if (parameters.replacedBy) {
            this.replacedByConcepts = this.updateReplacements(parameters.replacedBy);
            console.log("this.replacedByConcepts" + this.replacedByConcepts);
            if (this.replacedByConcepts.length > 0) {
              let rowId = "1";
              let sourceIndex = "1";
              let sourceCode = "1";
              let sourceDisplay = "diaply";
              let targetCode = this.replacedByConcepts[0].code;
              let targetDisplay = this.replacedByConcepts[0].display;
              let relationship = MapRowRelationship.INEXACT;
              let status = MapRowStatus.DRAFT;
              let noMap = false;
              let flagged = true;
              let tags = ["replacement"];
              this.targetRows.push(new MapView(rowId, undefined, sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, 
                relationship, status, noMap, undefined, undefined, undefined, undefined, undefined, flagged, undefined, tags, undefined))
            }
          }
          if (parameters.possiblyEquivalentTo) {
            this.possiblyEquivalentToConcepts = this.updateReplacements(parameters.possiblyEquivalentTo);
            console.log("this.possibleyEquivalentToConcepts" + this.possiblyEquivalentToConcepts);
            if (this.possiblyEquivalentToConcepts.length > 0) {
              let rowId = "1";
              let sourceIndex = "1";
              let sourceCode = "1";
              let sourceDisplay = "diaply";
              let targetCode = this.possiblyEquivalentToConcepts[0].code;
              let targetDisplay = this.possiblyEquivalentToConcepts[0].display;
              let relationship = MapRowRelationship.INEXACT;
              let status = MapRowStatus.DRAFT;
              let noMap = false;
              let flagged = true;
              let tags = ["replacement"];
              this.targetRows.push(new MapView(rowId, undefined, sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, 
                relationship, status, noMap, undefined, undefined, undefined, undefined, undefined, flagged, undefined, tags, undefined))
            }
          }
          if (parameters.alternative) {
            this.alternativeConcepts = this.updateReplacements(parameters.alternative);
            console.log("this.alternativeConcepts" + this.alternativeConcepts);
            if (this.alternativeConcepts.length > 0) {
              let rowId = "1";
              let sourceIndex = "1";
              let sourceCode = "1";
              let sourceDisplay = "diaply";
              let targetCode = this.alternativeConcepts[0].code;
              let targetDisplay = this.alternativeConcepts[0].display;
              let relationship = MapRowRelationship.INEXACT;
              let status = MapRowStatus.DRAFT;
              let noMap = false;
              let flagged = true;
              let tags = ["replacement"];
              this.targetRows.push(new MapView(rowId, undefined, sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, 
                relationship, status, noMap, undefined, undefined, undefined, undefined, undefined, flagged, undefined, tags, undefined))
            }
          }

        }
      },
      //TODO change error message
      error => this.translate.get('ERROR.CONCEPT_SEARCH').subscribe((res) => this.error.message = res)
    ));
  }

  updateReplacements(parameters: IParameters): Coding[] {
    let conceptList: Coding[] = [];
    if (parameters.parameter && parameters.parameter[0].name === "result" && parameters.parameter[0].valueBoolean === true) {
      if (parameters.parameter[1].name === "match") {
        let part = parameters.parameter[1].part;
        part?.forEach(item => {
          if (item.name === "concept") {
            if (item.valueCoding && item.valueCoding.code && item.valueCoding.display) {
              conceptList.push({
                code: item.valueCoding.code,
                display: item.valueCoding.display,

              });
            }
          }
        })

      }
    }
    return conceptList;

  }

  click(row: MapView): void {
    this.selectionService.select({
      code: row.targetCode,
      system: this.task?.mapping.toSystem ?? 'http://snomed.info/sct',
      version: this.task?.mapping.toVersion,
    });
  }

  /**
   * onDrop from search box (new item) or between relationships
   * @param event MapView object
   * @param relationship String relationship
   */
  onDrop(event: DroppableEventObject, relationship: string): void {
    const self = this;
    if (self.source && event.data && !StatusUtils.inReviewedState(self.source.status as MapRowStatus)) {
      if (!event.data.rowId) {
        self.addSelection(event.data.code, event.data.display, event.data.system, relationship);
      } else {
        const updatedTarget = self.targetRows.map((t) => t)
          .filter((m) => m.targetCode === event.data.targetCode)[0];
        updatedTarget.relationship = relationship;
        updatedTarget.status = MapRowStatus.DRAFT;
        updatedTarget.noMap = false;
        self.newTargetEvent.emit(updatedTarget);
      }
    }
  }

  filterRows(relationship: MapRowRelationship): MapView[] {
    return (this.targetRows && this.targetRows.length > 0) ? this.targetRows.map((m) => m).filter(
      (row) => row.relationship === relationship) : [];
  }

  addFocusTarget(relationship: MapRowRelationship): void {
    if (this.selectedSearchItem) {
      this.addSelection(this.selectedSearchItem.code, this.selectedSearchItem.display, this.selectedSearchItem.system, relationship);
    }
  }

  addSelection(code: string, display: string, system: string, relationship: string): void {
    const self = this;

    self.fhirService.getEnglishFsn(code, system, self.task?.mapping?.toVersion || '').subscribe(englishFsn => {
      let displayTerm = display;
      if (englishFsn !== '') {
        displayTerm = englishFsn;
      }

      if (self.source) {
        const targetRow = new MapView('', '', self.source.index, self.source.code,
          self.source.display, code, displayTerm, relationship, MapRowStatus.DRAFT,
          false, null, null, null, null, null, false, false, undefined, self.source.additionalColumnValues);
        const duplicate = self.targetRows.find((row: any) => row.targetCode === targetRow.targetCode);
        if (!duplicate) {
          self.newTargetEvent.emit(targetRow);
          self.error = {}; // clear any duplicate errors
        } else {
          self.translate.get('ERROR.DUPLICATE_TARGET_ERROR').subscribe((res: any) => {
            self.error.message = res;
          });
        }
      }

    });
  }

  removeTarget(targetRow: MapView): void {
    const self = this;
    self.removeTargetEvent.emit(targetRow);
  }

  onMapMaintenance(): void {

    this.targetRows.forEach(targetRow => {
      console.log("targetRow", targetRow);
      if (targetRow.targetOutOfScope && targetRow.targetCode) {
        //TODO: system / version .. also in api
        this.store.dispatch(new FindSuggestedReplacementConcepts({
          code: targetRow.targetCode,//"72940011000036107",
          system: "",//self.selectedSearchItem.system,
          version: ""//self.selectedSearchItem.version
        }));
      }
    })


  }

  isNoMap(): boolean {
    return this.source?.noMap ?? false;
  }

  updateFlag(maprow: MapView): void {
    const self = this;
    maprow.flagged = !maprow.flagged;
    self.flagEvent.emit(maprow);
  }
}
