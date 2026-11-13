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
import { DisplayResolvedLookupConcept} from '../store/fhir-feature/fhir.actions';
import { Properties } from '../store/fhir-feature/fhir.effects';
import { selectDisplayResolvedConceptProperties} from '../store/fhir-feature/fhir.selectors';
import { SelectionService } from '../_services/selection.service';

@Component({
    selector: 'app-concept-properties',
    templateUrl: './concept-properties.component.html',
    styleUrls: ['./concept-properties.component.css'],
    standalone: false
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
  attributeRelationshipsView: {
    firstValue: boolean, // used to indicate a line should be drawn to separate previous values
    roleGroup: boolean, // used to indicate this is the first element in a role group
    key: string,
    value: any,
  }[] = [];
  error: ErrorInfo = {};

  displayedColumns = [
    'key',
    'aux',
    'value',
  ];

  displayedAttributeRelationshipColumns = [
    'roleGroup',  // this is where the role group symbol sits
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

  private displayedAttributeRelationshipProps = [
    'parent',
    'attributeRelationships'
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
          self.store.dispatch(new DisplayResolvedLookupConcept({
            code: selection.code,
            system: selection.system,
            version: self.selectionVersion ?? self.version,
            properties: ["*"]
          }));
        }
      },
      error(error): void { console.error('Selection error', error); },
      complete(): void {}
    }));

    self.subscription.add(self.store.select(selectDisplayResolvedConceptProperties).subscribe(
      (props) => {
        self.propertiesView = [];
        self.attributeRelationshipsView = [];
        if (props) {
          this.displayedProps.concat(this.displayedAttributeRelationshipProps).forEach(p => {
            props[p]?.forEach(v => {
              if (p === 'Fully specified name') {
                self.display = v[0];
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
                case "attributeRelationships":

                  let attributeCode : string = "";
                  let attributeValue : string = "";
                  let isFirst = true;

                  if (v[0] instanceof Array) {
                    v.forEach((subproperty: { name: string; valueCode: any; valueString: string}[]) => {
                      if (subproperty instanceof Array) {
                        ({attributeCode, attributeValue} = this.processSubproperty(subproperty));
                      }
  
                      let displayRoleGroup = false;
                      if (isFirst) {
                        displayRoleGroup = true;
                        isFirst = false;
                      }
                      this.attributeRelationshipsView.push({firstValue: displayRoleGroup, roleGroup: displayRoleGroup, key: attributeCode, value: [attributeValue]})
                    });
                  }
                  else {
                    ({attributeCode, attributeValue} = this.processSubproperty(v));
                    // SNOMED CT diagramming guidelines specify ungrouped attributes should be displayed before grouped attributes
                    this.attributeRelationshipsView.unshift({firstValue: true, roleGroup: false, key: attributeCode, value: [attributeValue]})
                  }

                  break;
                // Removed 28/02/23 due to duplication with tree view and space limitations
                // case "parent":
                //   this.attributeRelationshipView.push({firstValue: false, roleGroup: false, key: "parent", value: v});
                //   break;
                default: 
                  this.propertiesView.push({ key: p, value: v });
                  break;
              }

            });
          });
          // first entry does not have a line above it to separate attributes
          if (this.attributeRelationshipsView.length > 0) {
            this.attributeRelationshipsView[0]['firstValue'] = false;
          }

        }
      },
      (_error) => this.translate.get('ERROR.CONCEPT_LOOKUP').subscribe((res) => this.error.message = res)
    ));

    self.propertiesView = [];
    self.attributeRelationshipsView = [];

  }

  private processSubproperty(subproperty: { name: string; valueCode: any; valueString: string; }[]) {
    let attributeCode : string = "";
    let attributeValue : string = "";
    subproperty.forEach((part: { name: string; valueCode: any; valueString: string}) => {
      if ('code' === part.name && part.hasOwnProperty('valueString')) {
        if (part.hasOwnProperty('valueString')) {
          attributeCode = part.valueString;
        }
        else {
          attributeCode = part.valueCode;
        }
      } else if ('value' === part.name || 'valueCode' === part.name) {
        if (part.hasOwnProperty('valueString')) {
          attributeValue = part.valueString;
        }
        else {
          attributeValue = part.valueCode;
        }
      } else if (part.name.startsWith('value')) {
        let valueName;
        type ObjectKey = keyof typeof part;

        Object.getOwnPropertyNames(part).map(objectName => {
          if (objectName.startsWith('value')) {
            valueName = objectName as ObjectKey;
          }

        })
        if (valueName) {
          attributeValue = part[valueName];
        }

      }
      
    });

    return {attributeCode: attributeCode, attributeValue: attributeValue};
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
