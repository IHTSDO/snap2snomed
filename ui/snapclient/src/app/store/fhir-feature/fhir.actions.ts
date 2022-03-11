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

import {Action} from '@ngrx/store';
import {R4} from '@ahryman40k/ts-fhir-types';
import {Version} from '../../_services/fhir.service';
import { Properties } from './fhir.effects';
import {Coding, Match} from './fhir.reducer';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';


export enum FhirActionTypes {
  LOAD_VERSIONS = '[Fhir] Load Versions',
  LOAD_VERSIONS_SUCCESS = '[Fhir] Load Versions Succeeded',
  LOAD_VERSIONS_FAILED = '[Fhir] Load Versions Failed',
  FIND_CONCEPTS = '[Fhir] Find Concepts',
  FIND_CONCEPTS_SUCCESS = '[Fhir] Find Concepts Succeeded',
  FIND_CONCEPTS_FAILED = '[Fhir] Find Concepts Failed',
  AUTO_SUGGEST = '[Fhir] Automap Concepts',
  AUTO_SUGGEST_SUCCESS = '[Fhir] Automap Concepts Succeeded',
  AUTO_SUGGEST_FAILED = '[Fhir] Automap Concepts Failed',
  LOOKUP_CONCEPT = "[Fhir] Lookup Concept",
  LOOKUP_CONCEPT_SUCCESS = "[Fhir] Lookup Concept Succeeded",
  LOOKUP_CONCEPT_FAILED = "[Fhir] Lookup Concept Failed",
  CONCEPT_HIERARCHY = "[Fhir] Concept Hierarchy",
  CONCEPT_HIERARCHY_SUCCESS = "Concept Hierarchy Succeeded",
  CONCEPT_HIERARCHY_FAILED = "Concept Hierarchy Failed"
}

export class LoadVersions implements Action {
  readonly type = FhirActionTypes.LOAD_VERSIONS;
}

export class LoadVersionsSuccess implements Action {
  readonly type = FhirActionTypes.LOAD_VERSIONS_SUCCESS;

  constructor(public payload: Version[]) {
  }
}

export class LoadVersionsFailure implements Action {
  readonly type = FhirActionTypes.LOAD_VERSIONS_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class FindConcepts implements Action {
  readonly type = FhirActionTypes.FIND_CONCEPTS;

  constructor(public payload: {text: string, version: string, scope: string, activeOnly?:boolean}) {
  }
}

export class FindConceptsSuccess implements Action {
  readonly type = FhirActionTypes.FIND_CONCEPTS_SUCCESS;

  constructor(public payload: R4.IValueSet_Expansion) {
  }
}

export class FindConceptsFailure implements Action {
  readonly type = FhirActionTypes.FIND_CONCEPTS_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class AutoSuggest implements Action {
  readonly type = FhirActionTypes.AUTO_SUGGEST;

  constructor(public payload: {text: string, version: string, scope: string, strategy: string, activeOnly?:boolean}) {
  }
}

export class AutoSuggestSuccess implements Action {
  readonly type = FhirActionTypes.AUTO_SUGGEST_SUCCESS;

  constructor(public payload: Match[]) {
  }
}

export class AutoSuggestFailure implements Action {
  readonly type = FhirActionTypes.AUTO_SUGGEST_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class LookupConcept implements Action {
  readonly type = FhirActionTypes.LOOKUP_CONCEPT;

  constructor(public payload: {code: string, system: string, version: string}) {
  }
}

export class LookupConceptSuccess implements Action {
  readonly type = FhirActionTypes.LOOKUP_CONCEPT_SUCCESS;

  constructor(public payload: Properties) {
  }
}

export class LookupConceptFailure implements Action {
  readonly type = FhirActionTypes.LOOKUP_CONCEPT_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class ConceptHierarchy implements Action {
  readonly type = FhirActionTypes.CONCEPT_HIERARCHY;

  constructor(public payload: {code: string, system: string, version: string}) {
  }
}

export class ConceptHierarchySuccess implements Action {
  readonly type = FhirActionTypes.CONCEPT_HIERARCHY_SUCCESS;

  constructor(public payload: ConceptNode<Coding>[]) {
  }
}

export class ConceptHierarchyFailure implements Action {
  readonly type = FhirActionTypes.CONCEPT_HIERARCHY_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export type FhirActions = LoadVersions
  | LoadVersionsSuccess
  | LoadVersionsFailure
  | FindConcepts
  | FindConceptsSuccess
  | FindConceptsFailure
  | AutoSuggest
  | AutoSuggestSuccess
  | AutoSuggestFailure
  | LookupConcept
  | LookupConceptSuccess
  | LookupConceptFailure
  | ConceptHierarchy
  | ConceptHierarchySuccess
  | ConceptHierarchyFailure
;
