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

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { FhirService } from '../../_services/fhir.service';
import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  LoadReleasesSuccess,
  LoadReleasesFailure,
  FhirActions,
  FhirActionTypes,
  FindConceptsSuccess,
  FindConceptsFailure,
  LookupConceptSuccess,
  LookupConceptFailure,
  AutoSuggestSuccess,
  AutoSuggestFailure,
  ConceptHierarchySuccess,
  ConceptHierarchyFailure,
  LookupModuleSuccess,
  LookupModuleFailure,
  FindSuggestedReplacementConceptsSuccess,
  FindSuggestedReplacementConceptsFailure
} from './fhir.actions';

import { Release } from '../../_services/fhir.service';
import {TranslateService} from '@ngx-translate/core';
import {SnomedUtils} from 'src/app/_utils/snomed_utils';
import { forkJoin } from 'rxjs';

export interface Properties {
  [key: string]: any[]
};

@Injectable()
export class FhirEffects {

  loadReleases$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.LOAD_RELEASES),
    switchMap((action) => this.fhirService.fetchVersions().pipe(
      map(bundle => (bundle.entry ?? [])),
      map(entries => {
        return entries
          .map(entry => entry.resource as R4.ICodeSystem)
          .filter(res => res.version)
          .map(res => {
            const ver = res.version ?? '';
            const edition = SnomedUtils.parserVersionUri(ver).edition;
            let label = res.title;
            this.translate.get(`EDITION.${edition}`).subscribe(msg => { label = msg; });
            return {
              edition: label,
              version: ver?.replace(/.*\//, ''),
              uri: ver,
            } as Release;
          });
      }),
      switchMap((versions: Release[]) => {
        let groupedVersions = new Map<string, Release[]>();
        versions.forEach(version => {

          if (groupedVersions.has(version.edition)) {
            let versionList = groupedVersions.get(version.edition);
            versionList?.push(version);
          }
          else {
            groupedVersions.set(version.edition, [version]);
          }
        });
        return of(new LoadReleasesSuccess(groupedVersions));
      }),
      catchError((err) => of(new LoadReleasesFailure({ error: err })))
    ))), { dispatch: true });

  findConcepts$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.FIND_CONCEPTS),
    map(action => action.payload),
    switchMap((action) => this.fhirService.findConcepts(action.text, action.version, action.scope, action.activeOnly).pipe(
      map(valueset => {
        if (!valueset.expansion) throw 'No expansion in search result';
        return valueset.expansion;
      }),
      switchMap((matches) => of(new FindConceptsSuccess(matches))),
      catchError((err) => of(new FindConceptsFailure({ error: err })))
    ))), { dispatch: true });

  conceptHierarchy$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.CONCEPT_HIERARCHY),
    map(action => action.payload),
    switchMap((action) => this.fhirService.conceptHierarchy(action.code, action.system, action.version).pipe(
      switchMap((matches) => of(new ConceptHierarchySuccess(matches))),
      catchError((err) => of(new ConceptHierarchyFailure({error: err})))
    ))), {dispatch: true});

  autoSuggest$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.AUTO_SUGGEST),
    map(action => action.payload),
    switchMap((action) => this.fhirService.autoSuggest(action.text, action.version, action.scope, action.strategy, action.activeOnly).pipe(
      switchMap((matches) => of(new AutoSuggestSuccess(matches))),
      catchError((err) => of(new AutoSuggestFailure({error: err})))
    ))), {dispatch: true});

  mapParameters = (parameters: R4.IParameters, action: { code: any; system: any; version?: any; }) => {
    let props: Properties = {};

    parameters.parameter?.map((p) => {
      const key = p.name ?? '';
      const part: any = p.part;
      switch (key) {
        case 'property': {
          if (part) {
            const partKey = part.find((sub: any) => sub?.name === 'code').valueCode;
            const partValue = FhirEffects.getValue(part.find((sub: any) => sub.name?.startsWith('value')));
            FhirEffects.updateProps(props, partKey, [partValue]);
          }
          break;
        }
        case 'designation': {
          if (part) {
            const partUse = part.find((sub: any) => sub.name === 'use')?.valueCoding?.display;
            if (partUse) {
              const partLang = part.find((sub: any) => sub.name === 'language')?.valueCode;
              const partValue = FhirEffects.getValue(part.find((part: any) => part.name === 'value'));
              FhirEffects.updateProps(props, partUse, [partValue, partLang]);
            }
          }
          break;
        }
        default: {
          const value = FhirEffects.getValue(p);
          FhirEffects.updateProps(props, key, [value]);
        }
      }
    })
    
    // SNOMED-465
    // there is no guarantee that code and system are supplied by $lookup, but they
    // may be, so now they are added at the end if they aren't already present
    if (!props.code) {
      FhirEffects.updateProps(props, 'code', [action.code]);
    }
    else if (!props.system) {
      FhirEffects.updateProps(props, 'system', [action.system]);
    }

    return props;
  }

  lookupModule$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.LOOKUP_MODULE),
    map(action => action.payload),
    switchMap((action) => this.fhirService.lookupConcept(action.code, action.system, action.version).pipe(
      map(parameters => this.mapParameters(parameters, action)),
      switchMap((props) => of(new LookupModuleSuccess(props))),
      catchError((err) => of(new LookupModuleFailure({ error: err })))
    ))), { dispatch: true });

  lookupConcept$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.LOOKUP_CONCEPT),
    map(action => action.payload),
    switchMap((action) => this.fhirService.lookupConcept(action.code, action.system, action.version).pipe(
      map(parameters => this.mapParameters(parameters, action)),
      switchMap((props) => of(new LookupConceptSuccess(props))),
      catchError((err) => of(new LookupConceptFailure({ error: err })))
    ))), { dispatch: true });

  findSuggestedReplacementConcepts$ = createEffect(() => this.actions$.pipe(
    ofType(FhirActionTypes.FIND_SUGGESTED_REPLACEMENT_CONCEPTS),
    map(action => action.payload),
    switchMap((action) => forkJoin({
      sameAs: this.fhirService.findSameAsConcepts(action.code, action.scope, action.version),
      replacedBy: this.fhirService.findReplacedByConcepts(action.code, action.scope, action.version),
      possiblyEquivalentTo: this.fhirService.findPossiblyEquivalentTo(action.code, action.scope, action.version),
      alternative: this.fhirService.findAlternative(action.code, action.scope, action.version),
      code: action.code
    }).pipe(
      switchMap((map) => of(new FindSuggestedReplacementConceptsSuccess(map))),
      catchError((err) => of(new FindSuggestedReplacementConceptsFailure({ error: err })))
    ))), { dispatch: true });

  constructor(
    private actions$: Actions<FhirActions>,
    private fhirService: FhirService,
    private translate: TranslateService,
  ) {
  }

  private static updateProps(props: Properties, key: string, value: any[]) {
    if (key && value) {
      if (props[key]) {
        props[key] = [...props[key], value];
      } else {
        props[key] = [value];
      }
    }
  }

  private static getValue(thing: any): any {
    const valueKey: string | undefined = Object.keys(thing ?? {}).find(name => name.startsWith('value'));
    return valueKey && thing[valueKey];
  }

}
