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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {ErrorInfo} from '../errormessage/errormessage.component';
import { IAppState } from '../store/app.state';
import { LookupConcept, LookupModule } from '../store/fhir-feature/fhir.actions';
import { Properties } from '../store/fhir-feature/fhir.effects';
import { selectConceptProperties, selectModuleProperties } from '../store/fhir-feature/fhir.selectors';
import { SelectionService } from '../_services/selection.service';

@Component({
  selector: 'app-concept-properties',
  templateUrl: './concept-properties.component.html',
  styleUrls: ['./concept-properties.component.css']
})
export class ConceptPropertiesComponent implements OnInit, OnDestroy {
  @Input() active = true;
  @Input() version = '';

  code = '';
  display = '';
  system = 'http://snomed.info/sct';
  selectionVersion = '';

  properties: Properties = {};
  propertiesView: {
    key: string,
    value: any,
  }[] = [];
  error: ErrorInfo = {};

  displayedColumns = [
    'key',
    'aux',
    'value',
  ];

  private displayedProps = [
    'code',
    'Fully specified name',
    'display',
    'inactive',
    // 'Preferred For Language',
    'Synonym',
    // 'system',  // Kylynn says no
    // 'version', // Kylynn says no
    'effectiveTime',
    'moduleId',
  ];
  private subscription = new Subscription();

  constructor(
    public translate: TranslateService,
    private selectionService: SelectionService,
    private store: Store<IAppState>) {
  }

  ngOnInit(): void {
    const self = this;

    self.subscription.add(this.selectionService.subscribe({
      next(selection: any): void {
        if (self.active && selection?.code) {
          self.code = selection.code;
          self.display = selection.display;
          self.system = selection.system;
          self.selectionVersion = selection.version;
          self.store.dispatch(new LookupConcept({
            code: selection.code,
            system: selection.system,
            version: self.selectionVersion ?? self.version,
          }));
        }
      },
      error(error): void { console.error('Selection error', error); },
      complete(): void {}
    }));

    self.subscription.add(self.store.select(selectModuleProperties).subscribe(
      (props) => {
        if (props) {
          // replace module id with preferred term
          var foundIndex = this.propertiesView.findIndex(x => x.key == 'module');
          if (foundIndex > -1) {
            this.propertiesView[foundIndex] = { key: 'module', value: [props['display'][0][0]] };
            // trigger angular change detection
            this.propertiesView =  [...this.propertiesView];
          }
        }
      },
      (_error) => this.translate.get('ERROR.MODULE_LOOKUP').subscribe((res) => this.error.message = res)
    ));

    self.subscription.add(self.store.select(selectConceptProperties).subscribe(
      (props) => {
        self.propertiesView = [];
        if (props) {
          this.displayedProps.forEach(p => {
            props[p]?.forEach(v => {
              if (p === 'Fully specified name') {
                self.display = v[0];
              }
              if (p === 'moduleId') {
                // run a separate query to get the module label now that we know the module id
                self.store.dispatch(new LookupModule({
                  code: v[0],
                  system: self.system,
                  version: self.selectionVersion ?? self.version,
                }));
              }
              
              switch ( p ) {
                case "display":
                  // SNOMED-451: "display" to read "preferred term"
                  this.propertiesView.push({ key: "preferred term", value: v });
                  break;
                case "inactive":
                  // SNOMED-451: "inactive" to read "active"
                  this.propertiesView.push({ key: "active", value: [!v[0]]})
                  break;
                case "moduleId":
                  // SNOMED-451: display PT rather than id
                  // moduleId gets replaced with PT when selectModuleProperties
                  this.propertiesView.push({ key: "module", value: v}) 
                  break;
                default: 
                  this.propertiesView.push({ key: p, value: v });
                  break;
              }

            });
          });
        }
      },
      (_error) => this.translate.get('ERROR.CONCEPT_LOOKUP').subscribe((res) => this.error.message = res)
    ));

    self.propertiesView = [];

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
