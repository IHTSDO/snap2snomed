/*
 * Copyright © 2026 SNOMED International
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

import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {testNestedParamsRoutes} from './test-routes';

// Locks in the param-inheritance contract the app relies on: MappingWorkComponent reads
// both :mappingid and :taskid off its own ActivatedRoute even though :mappingid is matched
// two levels up (see mapping-work.component.ts handleParams()). Angular 22 changes the
// router's default paramsInheritanceStrategy from 'emptyOnly' to 'always', so this is worth
// pinning now rather than discovering a regression only after that upgrade.
describe('AppRoutingModule param inheritance', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(testNestedParamsRoutes)]
    });
  });

  it('passes params from every ancestor route segment down to the leaf route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/map-view/123/map-work/456');

    let leaf = router.routerState.snapshot.root;
    while (leaf.firstChild) {
      leaf = leaf.firstChild;
    }

    expect(leaf.paramMap.get('mappingid')).toBe('123');
    expect(leaf.paramMap.get('taskid')).toBe('456');
  });
});
