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
import {MapRowRelationship, mapRowRelationships, MapRowStatus, MapView, TARGET_NO_ACTIVE_SUGGESTIONS_TAG, toMapRowStatus} from '../../_models/map_row';
import {MapService} from '../../_services/map.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DroppableEventObject} from '../../_directives/droppable.directive';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {SelectionService} from 'src/app/_services/selection.service';
import {Task, TaskType} from 'src/app/_models/task';
import {StatusUtils} from '../../_utils/status_utils';
import {SourceRow} from '../mapping-detail/mapping-detail.component';
import {WriteDisableUtils} from "../../_utils/write_disable_utils";
import {FhirService} from "../../_services/fhir.service";
import { SourceNavSet } from 'src/app/_services/source-navigation.service';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app.state';
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
  @Input() sourceNavSet: SourceNavSet | null = null;
  @Input() disableActions = false;
  @Input() disableFlagging = false;
  @Output() newTargetEvent = new EventEmitter<MapView>();
  @Output() removeTargetEvent = new EventEmitter<MapView>();
  @Output() noMapEvent = new EventEmitter<boolean>();
  @Output() flagEvent = new EventEmitter<MapView>();
  @Output() noReplacementEvent = new EventEmitter<MapView>();

  writeDisableUtils = WriteDisableUtils;
  toMapRowStatus = toMapRowStatus;

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
  }

  updateReplacements(parameters: IParameters): Coding[] {
    let conceptList: Coding[] = [];
    if (parameters.parameter && parameters.parameter[0].name === "result" && parameters.parameter[0].valueBoolean === true) {
      for (let index = 1; index < parameters.parameter.length; index++) {
        if (parameters.parameter[index].name === "match") {
          let part = parameters.parameter[index].part;
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
    console.log("on drop");
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
    let rows = (this.targetRows && this.targetRows.length > 0) ? this.targetRows.map((m) => m).filter(
      (row) => row.relationship === relationship) : [];
    return rows;
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
        const targetRow = new MapView('', '', self.source.id, self.source.index, self.source.code,
          self.source.display, code, displayTerm, relationship, MapRowStatus.DRAFT,
          false, null, null, null, null, null, null, false, false, undefined, self.source.additionalColumnValues, null);
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

  isReconcileTask() : boolean {
    if (this.task?.type === TaskType.RECONCILE) {
      return true;
    }
    return false;
  }
  
  addSuggestedConcepts(suggestedConcepts : Coding[], row: MapView) {
    suggestedConcepts.forEach(suggestedConcept => {

      this.fhirService.validateConceptInScopeAndActive(suggestedConcept.code, 
                this.task?.mapping.toSystem ?? 'http://snomed.info/sct', 
                this.task?.mapping.toVersion ?? '', 
                this.task?.mapping.toScope ?? '').subscribe(result => {

        let inScopeAndActive : boolean = true;

        if (result.parameter) {
 
          for (let param of result.parameter) {
            if (param.name === "result" && param.valueBoolean === false) {
              inScopeAndActive = false;
              break;
            }
            else if (param.name === "inactive" && param.valueBoolean === true) {
              inScopeAndActive = false;
              break;
            }
          }
        }
        else {
          inScopeAndActive = false;
        }


        if (inScopeAndActive) {
          this.addSelection(suggestedConcept.code, suggestedConcept.display, this.task?.mapping.toSystem ?? 'http://snomed.info/sct', 
          MapRowRelationship.INEXACT);
        }
        else {
          console.log("invalid .. update tag");
          // update tag to indicate there are no suggestions
          if (!row.tags?.includes(TARGET_NO_ACTIVE_SUGGESTIONS_TAG)) {
            row.tags?.push(TARGET_NO_ACTIVE_SUGGESTIONS_TAG);
            this.noReplacementEvent.emit(row);
          }

        }

      });

    })
  }

  onMapMaintenance(row: MapView): void {

    if (row.targetOutOfScope && row.targetCode) {
      this.fhirService.findReplacementConcepts(row.targetCode, this.task?.mapping.toScope ?? '', 
        this.task?.mapping.toVersion ?? '').subscribe(parameters => {

          let suggestionsFound : boolean = false;
          if (parameters) {
            if (parameters.sameAs) {
              let sameAsConcepts : Coding[] = this.updateReplacements(parameters.sameAs);
              if (!suggestionsFound && sameAsConcepts.length > 0) suggestionsFound = true;
              this.addSuggestedConcepts(sameAsConcepts, row);
            }
            if (parameters.replacedBy) {
              let replacedByConcepts : Coding[] = this.updateReplacements(parameters.replacedBy);
              if (!suggestionsFound && replacedByConcepts.length > 0) suggestionsFound = true;
              this.addSuggestedConcepts(replacedByConcepts, row);
            }
            if (parameters.possiblyEquivalentTo) {
              let possiblyEquivalentToConcepts : Coding[] = this.updateReplacements(parameters.possiblyEquivalentTo);
              if (!suggestionsFound && possiblyEquivalentToConcepts.length > 0) suggestionsFound = true;
              this.addSuggestedConcepts(possiblyEquivalentToConcepts, row);
            }
            if (parameters.alternative) {
              let alternativeConcepts : Coding[] = this.updateReplacements(parameters.alternative);
              if (!suggestionsFound && alternativeConcepts.length > 0) suggestionsFound = true;
              this.addSuggestedConcepts(alternativeConcepts, row);
            }
  
          }
          if (parameters && !suggestionsFound) {
            // update tag to indicate there are no suggestions
            if (!row.tags?.includes(TARGET_NO_ACTIVE_SUGGESTIONS_TAG)) {
              row.tags?.push(TARGET_NO_ACTIVE_SUGGESTIONS_TAG);
              this.noReplacementEvent.emit(row);
            }
          }

        })
    }

  }

  isNoMap(): boolean {
    return this.source?.noMap ?? false;
  }

  updateFlag(maprow: MapView): void {
    const self = this;
    maprow.flagged = !maprow.flagged;
    self.flagEvent.emit(maprow);
  }

  getTargetOutOfScopeTooltip(row: MapView) : string {

    if (row.tags?.includes(TARGET_NO_ACTIVE_SUGGESTIONS_TAG)) {
      return this.translate.instant("DETAILS.OUT_OF_SCOPE_NO_SUGGESTED_REPLACEMENTS");
    }
    else {
      return this.translate.instant("DETAILS.OUT_OF_SCOPE_FIND_REPLACEMENTS");
    }
  }

  isOutOfScopeWithSuggestions(row: MapView) : boolean {

    let outOfScopeWithSuggestions : boolean = false;

    if (row.targetOutOfScope) {
      if (!row.tags?.includes(TARGET_NO_ACTIVE_SUGGESTIONS_TAG)) {
        outOfScopeWithSuggestions = true;
      }
    }

    return outOfScopeWithSuggestions;
  }
}
