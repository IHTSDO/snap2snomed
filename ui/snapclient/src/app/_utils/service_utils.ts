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

import {HttpHeaders, HttpParams} from '@angular/common/http';
import {MapRowRelationship, MapViewFilter, MapViewPaging} from '../_models/map_row';
import {TranslateService} from '@ngx-translate/core';
import {Params} from '@angular/router';
import {TableParams} from '../mapping/mapping-table/mapping-table.component';
import {Source} from '../_models/source';
import {MappingImportSource} from '../_models/mapping_import_source';

export class ServiceUtils {

  static extractIdFromHref(href: string, suffix: string | null): string {
    if (suffix !== null) {
      href = href.split(suffix)[0];
    }
    const idx = href.lastIndexOf('/') + 1;
    return href.substr(idx);
  }

  static bytesToMB(sizeInBytes: number): string {
    const size = Math.round(sizeInBytes / (1024 * 1024));
    return size > 0 ? `${size}MB` : `${sizeInBytes} bytes`;
  }

  static getHTTPHeaders(): { headers: HttpHeaders, params?: any } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: '*/*',
      })
    };
  }

  static getHTTPUploadHeaders(): { headers: HttpHeaders, params?: any } {
    return {
      headers: new HttpHeaders({
        Accept: '*/*',
      })
    };
  }

  static toMime(source_type: string): string | null {
    switch (source_type.toUpperCase()) {
      case 'CSV':
        return 'text/csv';
      case 'TSV':
        return 'text/tsv';
      case 'TXT':
        return 'text/plain';
    }
    return null;
  }

  static sortNumberArray(numbers: number[]): number[] {
    return numbers.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });
  }

  /** Converts a list of numbers to a string with ranges
   * Will check unique then sort before processing
   *
   * @param numbers : list of numbers
   */
  static convertNumberArrayToRangeString(numbers: number[] | null | undefined): string {
    if (!numbers) {
      return '';
    }
    const delimiter = '-';
    const unique_ids = numbers.filter((x, i, a) => {
      return a.indexOf(x) === i;
    });
    const sorted = ServiceUtils.sortNumberArray(unique_ids);

    if (sorted.length > 0) {
      return sorted
        .reduce((accumulator: string, currentValue: number, index: number, array: number[]) => {
          if (index === 0) { // first
            accumulator += currentValue.toString();
          } else {
            if (array[index - 1] + 1 !== currentValue) { // not increment => add ','
              accumulator += ',' + array[index].toString();
            } else {
              if (array.length >= index + 1 && array[index + 1] - 1 !== currentValue) { // next value is not increment => add '-'
                accumulator += delimiter + array[index].toString();
              } else if (array.length === index + 1) { // last
                accumulator += ',' + currentValue.toString();
              }
            }
          }
          return accumulator;
        }, '');
    } else {
      return '';
    }
  }

  /** Expand ids from string of ranges
   * returns a number array
   *
   * @param rangerows comma delimited string of range indices eg 1-5,6
   */
  static expandSourceRows(rangerows: string): number[] {
    const expanded: number[] = [];
    if (rangerows && rangerows.length > 0) {
      rangerows.split(',').map((row_group) => {
        const rows = row_group.split('-').map(row => parseInt(row, 10));
        const begin = (rows.length > 1 && rows[0] > rows[1]) ? rows[1] : rows[0];
        const end = rows.length > 1 ? rows[0] > rows[1] ? rows[0] : rows[1] : null;
        expanded.push(begin);
        if (end) {
          let i = begin + 1;
          while (i <= end) {
            expanded.push(i);
            i++;
          }
        }
      });
    }
    return expanded;
  }

  static explainRelationship(translate: TranslateService, relationship: string | null): string {
    let rtn = '';
    if (relationship && relationship !== MapRowRelationship.EQUIVALENT) {
      translate.get(`MAP.${relationship}_SOURCE`).subscribe(val => rtn = val);
    }
    return rtn;
  }

  static filtersToParam(filterEntity: MapViewFilter): HttpParams {
    let params = new HttpParams();
    if (filterEntity.sourceCode && filterEntity.sourceCode.length > 0) {
      filterEntity.sourceCode.toString().match(/\S+/g)?.forEach(value => {
        params = params.append('sourceCode', value);
      });
    }
    if (filterEntity.sourceDisplay && filterEntity.sourceDisplay.length > 0) {
      filterEntity.sourceDisplay.toString().match(/\S+/g)?.forEach(value => {
        params = params.append('sourceDisplay', value);
      });
    }
    if (filterEntity.targetCode && filterEntity.targetCode.length > 0) {
      params = params.append('targetCode', filterEntity.targetCode);
    }
    if (filterEntity.targetDisplay && filterEntity.targetDisplay.length > 0) {
      filterEntity.targetDisplay.toString().match(/\S+/g)?.forEach(value => {
        params = params.append('targetDisplay', value);
      });
    }
    if (filterEntity.relationship && Array.isArray(filterEntity.relationship)) {
      filterEntity.relationship.forEach((value) => {
        params = params.append('relationship', value.toString());
      });
    }
    if (filterEntity.noMap !== undefined) {
      params = params.append('noMap', filterEntity.noMap.toString());
    }
    if (filterEntity.status && Array.isArray(filterEntity.status)) {
      filterEntity.status.forEach((value) => {
        params = params.append('status', value.toString());
      });
    }
    if (filterEntity.flagged !== undefined) {
      params = params.append('flagged', filterEntity.flagged.toString());
    }
    if (filterEntity.lastAuthorReviewer && filterEntity.lastAuthorReviewer.length > 0) {
      params = params.append('lastAuthorReviewer', filterEntity.lastAuthorReviewer.toString());
    }
    if (filterEntity.assignedAuthor && filterEntity.assignedAuthor.length > 0) {
      params = params.append('assignedAuthor', filterEntity.assignedAuthor.toString());
    }
    if (filterEntity.assignedReviewer && filterEntity.assignedReviewer.length > 0) {
      params = params.append('assignedReviewer', filterEntity.assignedReviewer.toString());
    }

    return params;
  }

  static paramsToFilterEntity(params: any): MapViewFilter {
    const mapViewFilter = new MapViewFilter();
    Object.keys(params).forEach(k => {
      const v = params[k];
      switch (k) {
        // filter
        case 'noMap':
          mapViewFilter.noMap = typeof v === 'string' ? v.toUpperCase() === 'TRUE' : v[0].toUpperCase() === 'TRUE';
          break;
        case 'flagged':
          mapViewFilter.flagged = typeof v === 'string' ? v.toUpperCase() === 'TRUE' : v[0].toUpperCase() === 'TRUE';
          break;
        case 'relationship':
          mapViewFilter.relationship = v;
          break;
        case 'sourceCode':
          mapViewFilter.sourceCode = v;
          break;
        case 'sourceDisplay':
          mapViewFilter.sourceDisplay = v;
          break;
        case 'status':
          mapViewFilter.status = v;
          break;
        case 'targetCode':
          mapViewFilter.targetCode = v;
          break;
        case 'targetDisplay':
          mapViewFilter.targetDisplay = v;
          break;
        case 'lastAuthorReviewer':
          mapViewFilter.lastAuthorReviewer = v;
          break;
        case 'assignedAuthor':
          mapViewFilter.assignedAuthor = v;
          break;
        case 'assignedReviewer':
          mapViewFilter.assignedReviewer = v;
          break;
      }
    });
    return mapViewFilter;
  }

  /**
   * pagingParamsToTableParams - converts Params for pagination to
   * 1. TableParams or 2. MapViewPaging  TODO Why do we have two types?
   * @param params Params
   * @param mapviewpaging indicate whether MapViewPaging required
   */
  static pagingParamsToTableParams(params: Params): TableParams {
    const tableParams = {} as TableParams;
    // sort & page
    Object.keys(params).forEach(k => {
      const v = params[k];
      switch (k) {
        case 'pageIndex':
          tableParams.pageIndex = v;
          break;
        case 'pageSize':
          tableParams.pageSize = v;
          break;
        case 'sortCol':
          tableParams.sortCol = v;
          break;
        case 'sortDirection':
          tableParams.sortDirection = v;
          break;
      }
    });
    return tableParams;
  }

  static pagingParamsToMapViewPaging(params: Params): MapViewPaging {
    const mapViewPaging = new MapViewPaging();
    // sort & page
    Object.keys(params).forEach(k => {
      const v = params[k];
      switch (k) {
        case 'pageIndex':
          mapViewPaging.pageIndex = v;
          break;
        case 'pageSize':
          mapViewPaging.pageSize = v;
          break;
        case 'sortCol':
          mapViewPaging.sortCol = v;
          break;
        case 'sortDirection':
          mapViewPaging.sortDirection = v;
          break;
      }
    });
    return mapViewPaging;
  }

  /**
   * Split filter values for translation and display as chips
   * @param filterString Parameterized filter string
   * eg "relationship=TARGET_EQUIVALENT,TARGET_NARROWER&status=INREVIEW,ACCEPTED,REJECTED,MAPPED"
   */
  static setFilterChipList(filterString: string): string[] {
    let filterList: string[] = [];
    filterString.split('&').map((f: string) => {
      if (f.startsWith('noMap')) {
        filterList.push('FILTERCHIP.' + f);
      } else if (f.startsWith('relationship')) {
        filterList = filterList.concat(f.split('=')[1].split(',').map((s) => `RELATIONSHIP.${s}`));
      } else if (f.startsWith('status')) {
        filterList = filterList.concat(f.split('=')[1].split(',').map((s) => `STATUS.${s}`));
      } else {
        filterList.push(f.split('=')[1]);
      }
    });
    return filterList;
  }

  static cleanParamId(paramIdString: string | null): string | null {
    if (!paramIdString) {
      return null;
    }
    const pattern = /\d+/g;
    const result = paramIdString.match(pattern);
    if (result) {
      return result[0];
    }
    return result;
  }

  // TODO: Maybe deprecate this as backend does the same thing
  /** Quick check of duplicates for small files - backend for full check */
  static hasDuplicateCodes(contents: string, data: Source | MappingImportSource, sourceType: string): boolean {
    const theContent = contents.split(this.getEOL());
    if (data.hasHeader) {
      theContent.splice(0, 1);
    }
    if (data.displayColumnIndex !== null && data.displayColumnIndex === 0) {
      if (theContent.length > 0 && theContent.length < 1000 && data !== null) {
        return this.checkDuplicates(theContent);
      }
      return false;
    }
    if (theContent.length > 0 && theContent.length < 1000 && data !== null
        && data.codeColumnIndex !== null) {
      let separator = sourceType === 'CSV' ? ',' : '\t';
      if (data.delimiter) {
        separator = data.delimiter;
      }
      const codeCol = data.codeColumnIndex;
      if (data instanceof Source) {
        return this.checkDuplicates(theContent.map((line) => line.split(separator)[codeCol]));
      } else {
        const displayCol = data.targetCodeColumnIndex;
        return this.checkDuplicates(theContent.map((line) =>  {
          const codelines = line.split(separator)[codeCol];
          let displaylines = '';
          if (displayCol) {
            displaylines = line.split(separator)[displayCol];
          }
          return codelines + displaylines;
        }));
      }
    }
    return false;
  }

  private static checkDuplicates(lines: any): boolean {
    const uniqueLines = lines.filter((v: any, i: any, a: any) => a.indexOf(v) === i);
    return lines.length !== uniqueLines.length;
  }

  public static getEOL(): string {
    return window.navigator.platform.startsWith('Win') ? '\r\n' : '\n';
  }

}
