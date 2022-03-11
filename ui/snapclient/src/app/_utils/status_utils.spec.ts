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

import {TestBed} from '@angular/core/testing';
import {StatusUtils} from './status_utils';
import {MapRowRelationship, MapRowStatus, MapView} from '../_models/map_row';
import {TaskType} from '../_models/task';

describe('StatusUtils', () => {
  const unmappedSource = new MapView('', undefined, '1', 'abc',
    'abc', undefined, undefined, undefined, MapRowStatus.UNMAPPED,
    false, null, null, null, null, null, undefined);
  const draftSource = new MapView('', undefined, '1', 'abc',
    'abc', '1234', 'target', MapRowRelationship.EQUIVALENT, MapRowStatus.DRAFT,
    false, null, null, null, null, null, false);
  const mappedSource = new MapView('', undefined, '1', 'abc',
    'abc', '1234', 'target', MapRowRelationship.EQUIVALENT, MapRowStatus.MAPPED,
    false, null, null, null, null, null, false);
  const draftSource_noMap = new MapView('', undefined, '1', 'abc',
    'abc', undefined, undefined, undefined, MapRowStatus.DRAFT,
    true, null, null, null, null, null, undefined);
  const mappedSource_noMap = new MapView('', undefined, '1', 'abc',
    'abc', undefined, undefined, undefined, MapRowStatus.MAPPED,
    true, null, null, null, null, null, undefined);
  const inreviewSource = new MapView('', undefined, '1', 'abc',
    'abc', '1234', 'target', MapRowRelationship.EQUIVALENT, MapRowStatus.INREVIEW,
    false, null, null, null, null, null, false);
  const acceptedSource = new MapView('', undefined, '1', 'abc',
    'abc', '1234', 'target', MapRowRelationship.EQUIVALENT, MapRowStatus.ACCEPTED,
    false, null, null, null, null, null, false);
  const rejectedSource = new MapView('', undefined, '1', 'abc',
    'abc', '1234', 'target', MapRowRelationship.EQUIVALENT, MapRowStatus.REJECTED,
    false, null, null, null, null, null, false);

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should detect AuthoredState', () => {
    const test1: [MapView, boolean] = [unmappedSource, false];
    const test2: [MapView, boolean] = [draftSource, true];
    const test3: [MapView, boolean] = [mappedSource, true];
    const test4: [MapView, boolean] = [draftSource_noMap, true];
    const test5: [MapView, boolean] = [mappedSource_noMap, true];
    const test6: [MapView, boolean] = [inreviewSource, false];
    const test7: [MapView, boolean] = [acceptedSource, false];
    const test8: [MapView, boolean] = [rejectedSource, false];
    let testLoop = 1;
    [test1, test2, test3, test4, test5, test6, test7, test8].forEach(
      (test) => {
        expect(StatusUtils.inAuthoredState(test[0].status as MapRowStatus)).toBe(test[1], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should detect ReviewedState', () => {
    const test1: [MapView, boolean] = [unmappedSource, false];
    const test2: [MapView, boolean] = [draftSource, false];
    const test3: [MapView, boolean] = [mappedSource, false];
    const test4: [MapView, boolean] = [draftSource_noMap, false];
    const test5: [MapView, boolean] = [mappedSource_noMap, false];
    const test6: [MapView, boolean] = [inreviewSource, true];
    const test7: [MapView, boolean] = [acceptedSource, true];
    const test8: [MapView, boolean] = [rejectedSource, false];
    let testLoop = 1;
    [test1, test2, test3, test4, test5, test6, test7, test8].forEach(
      (test) => {
        expect(StatusUtils.inReviewedState(test[0].status as MapRowStatus)).toBe(test[1], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for UNMAPPED [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.UNMAPPED;
    testcases.push([testTask, unmappedSource, testOption, false]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for DRAFT [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.DRAFT;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, false]);
    testcases.push([testTask, mappedSource, testOption, false]);
    testcases.push([testTask, draftSource_noMap, testOption, false]);
    testcases.push([testTask, mappedSource_noMap, testOption, false]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, false]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for MAPPED [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.MAPPED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, false]);
    testcases.push([testTask, mappedSource, testOption, false]);
    testcases.push([testTask, draftSource_noMap, testOption, false]);
    testcases.push([testTask, mappedSource_noMap, testOption, false]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, false]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for INREVIEW [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.INREVIEW;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for ACCEPTED [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.ACCEPTED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for REJECTED [AUTHOR]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    const testOption: MapRowStatus = MapRowStatus.REJECTED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for UNMAPPED [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.UNMAPPED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for DRAFT [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.DRAFT;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for MAPPED [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.MAPPED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, true]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, true]);
    testcases.push([testTask, inreviewSource, testOption, true]);
    testcases.push([testTask, acceptedSource, testOption, true]);
    testcases.push([testTask, rejectedSource, testOption, true]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for INREVIEW [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.INREVIEW;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, false]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, false]);
    testcases.push([testTask, inreviewSource, testOption, false]);
    testcases.push([testTask, acceptedSource, testOption, false]);
    testcases.push([testTask, rejectedSource, testOption, false]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for ACCEPTED [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.ACCEPTED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, false]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, false]);
    testcases.push([testTask, inreviewSource, testOption, false]);
    testcases.push([testTask, acceptedSource, testOption, false]);
    testcases.push([testTask, rejectedSource, testOption, false]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should disable Status Option for REJECTED [REVIEW]', () => {
    const testcases: [TaskType, MapView, MapRowStatus, boolean][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    const testOption: MapRowStatus = MapRowStatus.REJECTED;
    testcases.push([testTask, unmappedSource, testOption, true]);
    testcases.push([testTask, draftSource, testOption, true]);
    testcases.push([testTask, mappedSource, testOption, false]);
    testcases.push([testTask, draftSource_noMap, testOption, true]);
    testcases.push([testTask, mappedSource_noMap, testOption, false]);
    testcases.push([testTask, inreviewSource, testOption, false]);
    testcases.push([testTask, acceptedSource, testOption, false]);
    testcases.push([testTask, rejectedSource, testOption, false]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.isStatusOptionDisabled(test[0], test[1], test[2])).toBe(test[3], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should get Available Status options for AUTHOR', () => {
    const testcases: [TaskType, MapView, MapRowStatus[]][] = [];
    const testTask: TaskType = TaskType.AUTHOR;
    testcases.push([testTask, unmappedSource, [MapRowStatus.UNMAPPED]]);
    testcases.push([testTask, draftSource, [MapRowStatus.DRAFT, MapRowStatus.MAPPED]]);
    testcases.push([testTask, mappedSource, [MapRowStatus.DRAFT, MapRowStatus.MAPPED]]);
    testcases.push([testTask, draftSource_noMap, [MapRowStatus.DRAFT, MapRowStatus.MAPPED]]);
    testcases.push([testTask, mappedSource_noMap, [MapRowStatus.DRAFT, MapRowStatus.MAPPED]]);
    testcases.push([testTask, inreviewSource, [MapRowStatus.INREVIEW]]);
    testcases.push([testTask, acceptedSource, [MapRowStatus.ACCEPTED]]);
    testcases.push([testTask, rejectedSource, [MapRowStatus.DRAFT, MapRowStatus.MAPPED, MapRowStatus.REJECTED]]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.getAvailableStatusOptions(test[0], test[1].status as MapRowStatus)).toEqual(test[2], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('should get Available Status options for REVIEW', () => {
    const testcases: [TaskType, MapView, MapRowStatus[]][] = [];
    const testTask: TaskType = TaskType.REVIEW;
    testcases.push([testTask, unmappedSource, [MapRowStatus.UNMAPPED]]);
    testcases.push([testTask, draftSource, [MapRowStatus.DRAFT]]);
    testcases.push([testTask, mappedSource, [MapRowStatus.MAPPED, MapRowStatus.INREVIEW,
      MapRowStatus.ACCEPTED, MapRowStatus.REJECTED]]);
    testcases.push([testTask, draftSource_noMap, [MapRowStatus.DRAFT]]);
    testcases.push([testTask, mappedSource_noMap, [MapRowStatus.MAPPED, MapRowStatus.INREVIEW,
      MapRowStatus.ACCEPTED, MapRowStatus.REJECTED]]);
    testcases.push([testTask, inreviewSource, [MapRowStatus.INREVIEW, MapRowStatus.ACCEPTED, MapRowStatus.REJECTED]]);
    testcases.push([testTask, acceptedSource, [MapRowStatus.INREVIEW, MapRowStatus.ACCEPTED, MapRowStatus.REJECTED]]);
    testcases.push([testTask, rejectedSource, [MapRowStatus.INREVIEW, MapRowStatus.ACCEPTED, MapRowStatus.REJECTED]]);
    let testLoop = 1;
    testcases.forEach(
      (test) => {
        expect(StatusUtils.getAvailableStatusOptions(test[0], test[1].status as MapRowStatus)).toEqual(test[2], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

});

