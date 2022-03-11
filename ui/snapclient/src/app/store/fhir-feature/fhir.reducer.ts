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

import {FhirActions, FhirActionTypes} from './fhir.actions';
import {Version} from '../../_services/fhir.service';
import {R4} from '@ahryman40k/ts-fhir-types';
import {Properties} from './fhir.effects';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';

export interface Coding {
  code: string;
  system: string;
  version: string;
  display: string;
}

export interface Match {
  code?: string;
  system?: string;
  version?: string;
  display?: string;
  label?: string;
  tag?: string;
  inactive: boolean;
}

export interface IFhirState {
  versions: Version[];
  matches?: R4.IValueSet_Expansion;
  nodes: ConceptNode<Coding>[];
  suggests?: Match[];
  properties?: Properties;
  errorMessage: any | null;
}

export const initialFhirState: IFhirState = {
  versions: [],
  nodes: [],
  errorMessage: null
};

export function fhirReducer(state = initialFhirState, action: FhirActions): IFhirState {
  switch (action.type) {

    case FhirActionTypes.LOAD_VERSIONS_SUCCESS:
      return {
        ...state,
        versions: action.payload,
        errorMessage: null
      };

    case FhirActionTypes.LOAD_VERSIONS_FAILED:
      return {
        ...state,
        versions: [],
        errorMessage: action.payload.error
      };

    case FhirActionTypes.FIND_CONCEPTS_SUCCESS:
      return {
        ...state,
        matches: action.payload,
        errorMessage: null
      };

    case FhirActionTypes.FIND_CONCEPTS_FAILED:
      return {
        ...state,
        matches: undefined,
        errorMessage: action.payload.error
      };

    case FhirActionTypes.AUTO_SUGGEST_SUCCESS:
      return {
        ...state,
        suggests: action.payload,
        errorMessage: null
      };

    case FhirActionTypes.AUTO_SUGGEST_FAILED:
      return {
        ...state,
        suggests: undefined,
        errorMessage: action.payload.error
      };

    case FhirActionTypes.LOOKUP_CONCEPT_SUCCESS:
      return {
        ...state,
        properties: action.payload,
        errorMessage: null
      };

    case FhirActionTypes.LOOKUP_CONCEPT_FAILED:
      return {
        ...state,
        properties: undefined,
        errorMessage: action.payload.error
      };

    case FhirActionTypes.CONCEPT_HIERARCHY_SUCCESS:
      return {
        ...state,
        nodes: action.payload,
        errorMessage: null
      };

    case FhirActionTypes.CONCEPT_HIERARCHY_FAILED:
      return {
        ...state,
        nodes: [],
        errorMessage: action.payload.error
      };

    default:
      return state;
  }
}
