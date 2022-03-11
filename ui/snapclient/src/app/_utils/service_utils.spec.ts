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
import {ServiceUtils} from './service_utils';

describe('ServiceUtils', () => {
  let serviceUtils: ServiceUtils;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    serviceUtils = new ServiceUtils();
  });

  it('should convert toMime correctly', () => {
    const tests = [['CSV', 'text/csv'], ['csv', 'text/csv'], ['TSV', 'text/tsv'], ['TXT', 'text/plain']];
    tests.forEach((test) => {
      expect(ServiceUtils.toMime(test[0])).toBe(test[1]);
    });
  });

  it('should extract Id from Href', () => {
    const href = 'https://blah.blah:4399/objects/test/1';
    const expected = '1';
    expect(ServiceUtils.extractIdFromHref(href, null)).toBe(expected);
    const hrefsuffix = 'https://blah.blah:4399/objects/test/1/projects';
    expect(ServiceUtils.extractIdFromHref(hrefsuffix, '/projects')).toBe(expected);
    const hrefsuffix2 = 'https://blah.blah:4399/objects/test/1/projects/other/stuff';
    expect(ServiceUtils.extractIdFromHref(hrefsuffix2, '/projects')).toBe(expected);
  });

  it('should create range list from number array', () => {
    const list1: [number[], string] = [[1, 2, 3, 6, 7, 8], '1-3,6-8']; // sorted list
    const list2: [number[], string] = [[2, 4], '2,4']; // no groups, 2 items
    const list3: [number[], string] = [[5], '5']; // 1 item
    const list4: [number[], string] = [[1, 3, 4, 5, 9], '1,3-5,9']; // middle group
    const list5: [number[], string] = [[1, 3, 4, 5, 6], '1,3-6']; // end group
    const list6: [number[], string] = [[1, 2, 3, 4, 9], '1-4,9']; // begin group
    const list7: [number[], string] = [[1, 3, 6, 9, 12], '1,3,6,9,12']; // no groups
    const list8: [number[], string] = [[2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 20], '2-8,13-15,20']; // multiple ranges
    const list9: [number[], string] = [[1, 5, 7, 8, 9, 23], '1,5,7-9,23']; // middle group not near start
    const list10: [number[], string] = [[2, 3, 4, 5], '2-5']; // all one group
    const list11: [number[], string] = [[5, 2, 8, 3, 1, 6, 7], '1-3,5-8']; // unsorted
    const list12: [number[], string] = [[5, 2, 6, 8, 3, 7, 1, 6, 7], '1-3,5-8']; // unsorted + duplicates
    const list13: [number[], string] = [[5, 2, 6, 8, 3, 7, 1, 6, 7, 8, 1], '1-3,5-8']; // unsorted + duplicates at min and max
    const list14: [number[], string] = [[3, 2, 2], '2-3']; // one group, 2 items
    const list15: [number[], string] = [[2, 3, 6], '2-3,6']; // regression, 2nd as group
    const list16: [number[], string] = [[2, 4, 5, 6], '2,4-6']; // regression, 2nd alone
    [list1, list2, list3, list4, list5, list6, list7, list8, list9, list10, list11, list12, list13, list14, list15, list16].forEach(
      (list) => {
        expect(ServiceUtils.convertNumberArrayToRangeString(list[0])).toBe(list[1]);
      });
  });

  it('should expand range list to number array', () => {
    const list1 = ['1,2,3,4', [1, 2, 3, 4]]; // no groups
    const list2 = ['1-4,5', [1, 2, 3, 4, 5]]; // begin group
    const list3 = ['5', [5]]; // 1 item
    const list4 = ['1,6-9', [1, 6, 7, 8, 9]]; // end group
    const list5 = ['2-8,13-15,20', [2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 20]]; // multiple group
    const list6 = ['26-20', [20, 21, 22, 23, 24, 25, 26]]; // backwards
    [list1, list2, list3, list4, list5, list6].forEach((list) => {
      expect(ServiceUtils.expandSourceRows(list[0] as string)).toEqual(list[1] as number[]);
    });
  });

  it('should create a filter list', () => {
    const string1 = ['noMap=false', ['FILTERCHIP.noMap=false']];
    const string2 = ['relationship=TARGET_EQUIVALENT', ['RELATIONSHIP.TARGET_EQUIVALENT']];
    const string3 = ['relationship=TARGET_EQUIVALENT,TARGET_NARROWER',
      ['RELATIONSHIP.TARGET_EQUIVALENT', 'RELATIONSHIP.TARGET_NARROWER']];
    const string4 = ['status=INREVIEW', ['STATUS.INREVIEW']];
    const string5 = ['status=INREVIEW,ACCEPTED,REJECTED,MAPPED',
      ['STATUS.INREVIEW', 'STATUS.ACCEPTED', 'STATUS.REJECTED', 'STATUS.MAPPED']];
    const string6 = ['relationship=TARGET_EQUIVALENT,TARGET_NARROWER&status=INREVIEW,ACCEPTED,REJECTED,MAPPED',
      ['RELATIONSHIP.TARGET_EQUIVALENT', 'RELATIONSHIP.TARGET_NARROWER',
        'STATUS.INREVIEW', 'STATUS.ACCEPTED', 'STATUS.REJECTED', 'STATUS.MAPPED']];
    const string7 = ['sourceCode=ABC', ['ABC']];
    const string8 = ['sourceCode=ABC&relationship=TARGET_EQUIVALENT&noMap=false',
      ['ABC', 'RELATIONSHIP.TARGET_EQUIVALENT', 'FILTERCHIP.noMap=false']];
    [string1, string2, string3, string4, string5, string6, string7, string8].forEach((list) => {
      expect(ServiceUtils.setFilterChipList(list[0] as string)).toEqual(list[1]);
    });
  });

});
