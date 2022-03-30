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

import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {ServiceUtils} from '../_utils/service_utils';
import {APP_CONFIG, AppConfig} from '../app.config';
import {R4} from '@ahryman40k/ts-fhir-types';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {ErrorDetail} from '../_models/error_detail';
import {BundleTypeKind, Bundle_RequestMethodKind} from '@ahryman40k/ts-fhir-types/lib/R4';
import {Coding, Match} from '../store/fhir-feature/fhir.reducer';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';

export const SEQUENCE = 'http://ontoserver.csiro.au/fhir/ConceptMap/automapstrategy-seq;automapstrategy-default;automapstrategy-MML'
export const DEFAULT = 'http://ontoserver.csiro.au/fhir/ConceptMap/automapstrategy-default';
export const MML = 'http://ontoserver.csiro.au/fhir/ConceptMap/automapstrategy-MML';

export interface Version {
  title: string;
  uri: string;
}

@Injectable({
  providedIn: 'root'
})
export class FhirService {

  private isOntoserver: boolean;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.isOntoserver = this.config && this.config.fhirBaseUrl ?
      this.config.fhirBaseUrl.indexOf('ontoserver') > 0 : false;
  }

  findOutliers(toSystem: string, toVersion: string, targets: string[], toScope: string) {
    const valueSet: R4.IValueSet = {
      resourceType: 'ValueSet',
      compose: {
        include: [{
          system: toSystem,
          version: toVersion,
          concept: targets.map(code => ({code: code}))
        }],
        exclude: [{
          valueSet: [FhirService.toValueSet(toVersion, `(${toScope}){{C active=true}}`)],
        }]
      }
    };

    const url = `${this.config.fhirBaseUrl}/ValueSet/$expand`;
    const params = {
      'count': 1000000,
    };
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    options.params = {...options.params, ...params};
    return this.http.post<R4.IValueSet>(url, valueSet, options);
  }

  fetchVersions(): Observable<R4.IBundle> {
    const url = `${this.config.fhirBaseUrl}/CodeSystem`;
    const params = {
      'url': 'http://snomed.info/sct',
      '_summary': 'true',
      '_sort': 'title,-version',
    };
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    options.params = {...options.params, ...params};
    return this.http.get<R4.IBundle>(url, options);
  }

  autoSuggest(text: string, version: string, scope: string, strategy: string, activeOnly: boolean = true, count: number = 5): Observable<Match[]> {
    if (this.isOntoserver) {
      const isMatch = (match: Match | null): match is Match => !!match;
      const ecl = activeOnly ? `(${scope}){{C active=true}}` : scope;

      const url = `${this.config.fhirBaseUrl}/ConceptMap/$translate`;
      const params = {
        'code': text,
        'system': 'http://ontoserver.csiro.au/fhir/CodeSystem/codesystem-terms',
        'url': strategy,
        'target': FhirService.toValueSet(version, ecl),
      };
      const options = ServiceUtils.getHTTPHeaders();
      options.headers = options.headers
        .set('Accept', ['application/fhir+json', 'application/json']);
      options.params = {...options.params, ...params};
      return this.http.get<R4.IParameters>(url, options).pipe(
        map(parameters => {
          return (parameters?.parameter ?? [])
            .filter(p => 'match' === p.name)
            .map(FhirService.paramToMatch)
            .filter(isMatch);
        })
      );
    } else {
      return this.findConcepts(text, version, scope, activeOnly, count).pipe(
        map(valueset => {
          return valueset.expansion?.contains?.slice(0, count).map(entry => {
            return {
              code: entry.code,
              system: entry.system,
              version: entry.version,
              display: entry.display,
              label: entry.display,
              inactive: activeOnly ? false : !!entry.inactive,
            };
          }) ?? [];
        })
      )
    }
  }

  findConcepts(text: string, version: string, scope: string, activeOnly: boolean = true, count: number = 100): Observable<R4.IValueSet> {
    const url = `${this.config.fhirBaseUrl}/ValueSet/$expand`;
    const params = {
      'filter': text,
      'url': FhirService.toValueSet(version, scope),
      'includeDesignations': true,
      'count': count,
      'activeOnly': activeOnly,
    };
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    options.params = {...options.params, ...params};
    return this.http.get<R4.IValueSet>(url, options);
  }

  static conceptNodeId(code: string, system: string): string {
    return system + '|' + code;
  }

  conceptHierarchy(code: string, system: string, version: string): Observable<ConceptNode<Coding>[]> {
    const toId = FhirService.conceptNodeId;

    const expansionToNodes = (valueset: R4.IValueSet): ConceptNode<Coding>[] => {
      if (!valueset.expansion) throw 'No expansion in search result';
      const expansion = valueset.expansion;

      // build map from code system to version
      const versions: {[key:string]: string} = {};
      expansion.parameter
        ?.filter(p => 'version' == p.name)
        ?.forEach(p => {
          const parts = p.valueUri?.split('|');
          if (parts) {
            versions[parts[0]] = parts[1];
          }
        });

      return expansion.contains
        ?.filter((entry: R4.IValueSet_Contains) => entry.code && entry.system && entry.display)
        .map((entry: R4.IValueSet_Contains) => {
          const directParents: string[] = [];
          const payload: Coding = {
              code: entry.code,
              system: entry.system,
              version: entry.version ?? versions[entry.system ?? ''],
              display: entry.display,
            } as Coding;
          const node: ConceptNode<Coding> = {
            id: toId(payload.system, payload.code),
            display: entry.display ?? payload.code,
            payload,
            directParents,
          };

          entry.extension?.filter(ext => 'http://hl7.org/fhir/5.0/StructureDefinition/extension-ValueSet.expansion.contains.property' == ext.url)
            .forEach(ext => {
              const map: any = {}
              ext.extension?.forEach(ext2 => {
                if ('code' == ext2.url) {
                  map.code = ext2.valueCode;
                }
                if ('value' == ext2.url) {
                  map.value = ext2;
                }
                // This is a fallback case for old versions of Ontoserver
                if ('value_x_' == ext2.url && typeof map.value === 'undefined') {
                  map.value = ext2;
                }
              });
              if (map.code == 'parent') {
                directParents.push(toId(payload.system, map.value.valueCode));
              } else if (map.code == 'sufficientlyDefined') {
                node.primitive = !map.value.valueBoolean;
              }
            });

          return node as ConceptNode<Coding>;
        }) ?? [];
    };

    const url = `${this.config.fhirBaseUrl}/ValueSet/$expand`;
    const ecl = `>>(${code}) OR <!(${code})`;
    const params = {
      'url': FhirService.toValueSet(version, ecl),
      // 'includeDesignations': true,
      'property': ['parent', 'sufficientlyDefined'],
      'count': 1000,
    };
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    options.params = {...options.params, ...params};
    return this.http.get<R4.IValueSet>(url, options).pipe(
      map(expansionToNodes),
      mergeMap(nodes => {
        if (this.isOntoserver) {
          return of(nodes);
        } else {
          const nodeMap: {[key: string]: ConceptNode<Coding>} = {};
          nodes.forEach(node => {
            nodeMap[node.id] = node;
          });
          const id = toId(system, code);
          const node = nodeMap[id];
          const directParents = nodeMap[id].directParents ?? [];
          const retainedNodes: ConceptNode<Coding>[] = [node];

          return this.lookupConcept(code, system, version).pipe(
            map(parameters => {
              parameters.parameter?.map(param => {
                if ('property' === param.name) {
                  let code: string | undefined;
                  let value: string | undefined;
                  param.part?.forEach(part => {
                    if ('code' === part.name) {
                      code = part.valueString;
                    } else if ('value' === part.name) {
                      value = part.valueCode;
                    }
                  });
                  if ('parent' === code && value) {
                    const parentId = toId(system, value);
                    directParents.push(parentId);
                    retainedNodes.push(nodeMap[parentId]);
                  } else if ('child' === code && value) {
                    const childId = toId(system, value);
                    (nodeMap[childId].directParents ?? []).push(node.id);
                    retainedNodes.push(nodeMap[childId]);
                  }
                }
              });

              return retainedNodes;
            })
          );
        }
      })
    );
  }

  hierarchyProperties(expansion: R4.IValueSet, version: string): Observable<R4.IBundle> {
    const url = `${this.config.fhirBaseUrl}`;
    const body: R4.IBundle = {
      resourceType: 'Bundle',
      type: BundleTypeKind._batch,
      entry: expansion.expansion?.contains?.map(item => {
        if (!item.system || !item.code) throw new Error("Incomplete data in ValueSet expansion");

        const system = encodeURIComponent(item.system);
        const code = encodeURIComponent(item.code);
        const system_version = encodeURIComponent(item.version ?? version);
        return {
          request: {
            method: Bundle_RequestMethodKind._get,
            url: `CodeSystem/$lookup?system=${system}&code=${code}&version=${system_version}`
          }
        }
      }),
    };
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    return this.http.post<R4.IBundle>(url, body, options);
  }

  lookupConcept(code: string, system: string, version: string, properties: string[] = []): Observable<R4.IParameters> {
    const url = `${this.config.fhirBaseUrl}/CodeSystem/$lookup`;
    const params: any = {
      'code': code,
      'system': system,
      'property': properties,
    };
    if (version) {
      params.version = version;
    }
    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);
    options.params = {...options.params, ...params};
    return this.http.get<R4.IParameters>(url, options);
  }

  private static toValueSet(version: string, ecl: string): string {
    return version + '?fhir_vs=ecl/' + encodeURIComponent(ecl.replace(/\s+/g, ' '));
  }

  validateEcl(ecl: string): Observable<{ valid: boolean, detail?: any }> {
    const url = `${this.config.fhirBaseUrl}/ValueSet/$expand`;
    const params: any = {
      url: FhirService.toValueSet('http://snomed.info/sct', ecl),
      count: 1,   // work around Snowstorm bug with count=0
    };

    const options = ServiceUtils.getHTTPHeaders();
    options.headers = options.headers
      .set('Accept', ['application/fhir+json', 'application/json']);

    options.params = {...options.params, ...params};
    return this.http.get<R4.IValueSet | R4.IOperationOutcome>(url, options)
      .pipe(
        map((res) => {
          if (res.resourceType === 'ValueSet') {
            return {valid: true};
          }
          return {valid: false, detail: FhirService.ooToErrorDetail('http://snap2snomed.app/problem/invalid-ecl', res)};
        }),
        catchError(result => of({valid: false, detail: FhirService.ooToErrorDetail('http://snap2snomed.app/problem/invalid-ecl', result.error)}))
      );
  }

  private static ooToErrorDetail(id: string, oo: R4.IOperationOutcome): ErrorDetail {
    const detail: ErrorDetail = {
      type: id,
      detail: '',
      title: '',
      status: 400,
      violations: [],
    };
    oo.issue.forEach(i => {
      detail.violations?.push({field: i.code ?? '', message: i.diagnostics ?? ''});
    });
    return detail;
  }

  private static paramToMatch(param: R4.IParameters_Parameter): Match | null {
    const coding = param.part?.find(p => 'concept' === p.name)?.valueCoding;
    if (coding) {
      const semanticTag = coding?.extension?.find(ex => 'http://snomed.info/field/semanticTag' === ex.url)?.valueString;
      return {
        inactive: false,
        ...coding,
        label: coding.display,
        tag: semanticTag,
      };
    } else {
      return null;
    }
  }

}
