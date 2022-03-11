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
import {MapRowStatus} from '../_models/map_row';
import {TaskType} from '../_models/task';
import {WriteDisableUtils} from "./write_disable_utils";

describe('WriteDisableUtils', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('status selection disabled', () => {
    const test1: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.UNMAPPED, false];
    const test2: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.DRAFT, false];
    const test3: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.MAPPED, false];
    const test4: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.INREVIEW, true];
    const test5: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.ACCEPTED, true];
    const test6: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.REJECTED, false];
    const test7: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.UNMAPPED, true];
    const test8: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.DRAFT, true];
    const test9: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.MAPPED, false];
    const test10: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.INREVIEW, false];
    const test11: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.ACCEPTED, false];
    const test12: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.REJECTED, false];
    let testLoop = 1;
    [test1].forEach(
      (test) => {
        expect(WriteDisableUtils.isStatusSelectionDisabled(test[0], test[1])).toBe(test[2], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('edit disabled', () => {
    const test1: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.UNMAPPED, false];
    const test2: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.DRAFT, false];
    const test3: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.MAPPED, false];
    const test4: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.INREVIEW, true];
    const test5: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.ACCEPTED, true];
    const test6: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.REJECTED, false];
    const test7: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.UNMAPPED, true];
    const test8: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.DRAFT, true];
    const test9: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.MAPPED, true];
    const test10: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.INREVIEW, true];
    const test11: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.ACCEPTED, true];
    const test12: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.REJECTED, true];
    let testLoop = 1;
    [test1].forEach(
      (test) => {
        expect(WriteDisableUtils.isEditDisabled(test[0], test[1])).toBe(test[2], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

  it('flagging disabled', () => {
    const test1: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.UNMAPPED, false];
    const test2: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.DRAFT, false];
    const test3: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.MAPPED, false];
    const test4: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.INREVIEW, true];
    const test5: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.ACCEPTED, true];
    const test6: [TaskType, MapRowStatus, boolean] = [TaskType.AUTHOR, MapRowStatus.REJECTED, true];
    const test7: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.UNMAPPED, true];
    const test8: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.DRAFT, true];
    const test9: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.MAPPED, true];
    const test10: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.INREVIEW, false];
    const test11: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.ACCEPTED, false];
    const test12: [TaskType, MapRowStatus, boolean] = [TaskType.REVIEW, MapRowStatus.REJECTED, false];
    let testLoop = 1;
    [test1].forEach(
      (test) => {
        expect(WriteDisableUtils.isFlaggingDisabled(test[0], test[1])).toBe(test[2], `Test:${testLoop}`);
        testLoop += 1;
      });
  });

});

