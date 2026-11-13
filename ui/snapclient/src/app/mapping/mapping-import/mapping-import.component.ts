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

import {AfterViewChecked, ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {map, mergeMap} from 'rxjs/operators';
import {ServiceUtils} from '../../_utils/service_utils';
import {SelectMappingFile} from '../../store/source-feature/source.actions';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {APP_CONFIG, AppConfig} from '../../app.config';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import { MatSelectChange } from '@angular/material/select';

// export interface HeaderDetails {
//   source_code_col_index: number;
//   target_code_col__index: number;
//   target_display_col__index: number;
//   relationship_col__index: number;
// }

interface RowColumn {
  value: string;
  viewValue: string;
}

const SOURCE_CODE_OPTION_LABEL = 'Source code';
//const SOURCE_DISPLAY_OPTION_LABEL = 'Source display';
const TARGET_CODE_OPTION_LABEL = 'Target code';
const TARGET_DISPLAY_OPTION_LABEL = 'Target display';
const RELATIONSHIP_TYPE_CODE_OPTION_LABEL = 'Relationship type code';
const NO_MAP_FLAG_OPTION_LABEL = "No map flag";
const STATUS_OPTION_LABEL = "Status";

const ALT_SOURCE_CODE_OPTION_LABEL = 'source_code';
const ALT_TARGET_CODE_OPTION_LABEL = 'target_code';
const ALT_TARGET_DISPLAY_OPTION_LABEL = 'target_display';
const ALT_RELATIONSHIP_TYPE_CODE_OPTION_LABEL = 'relationship';

const NUM_SAMPLE_LINES = 3;

@Component({
    selector: 'app-mapping-import',
    templateUrl: './mapping-import.component.html',
    styleUrls: ['./mapping-import.component.css', '../../source/source-import/source-import.component.css'],
    standalone: false
})
export class MappingImportComponent implements OnInit, OnDestroy, AfterViewChecked {

  readonly SOURCE_CODE_OPTION_VALUE = 'sourceCode';
  readonly TARGET_CODE_OPTION_VALUE = 'targetCode';
  readonly TARGET_DISPLAY_OPTION_VALUE = 'targetDisplay';
  readonly RELATIONSHIP_TYPE_CODE_OPTION_VALUE = 'relationshipTypeCode';
  readonly NO_MAP_FLAG_OPTION_VALUE = 'noMapFlag';
  readonly STATUS_OPTION_VALUE = "status";

  displayedColumns: string[] = [];
  dataSource : {[key: string]: string}[] = [];

  columns: RowColumn[] = [
    {value: this.SOURCE_CODE_OPTION_VALUE, viewValue: SOURCE_CODE_OPTION_LABEL},
//    {value: this.SOURCE_DISPLAY_OPTION_VALUE, viewValue: SOURCE_DISPLAY_OPTION_LABEL},
    {value: this.TARGET_CODE_OPTION_VALUE, viewValue: TARGET_CODE_OPTION_LABEL},
    {value: this.TARGET_DISPLAY_OPTION_VALUE, viewValue: TARGET_DISPLAY_OPTION_LABEL},
    {value: this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE, viewValue: RELATIONSHIP_TYPE_CODE_OPTION_LABEL},
    {value: this.NO_MAP_FLAG_OPTION_VALUE, viewValue: NO_MAP_FLAG_OPTION_LABEL},
    {value: this.STATUS_OPTION_VALUE, viewValue: STATUS_OPTION_LABEL},
  ];

  private readonly MAXFILESIZE: number;
  readonly MAX_NAME = 100;
  readonly MAX_VERSION = 30;
  fileaccept = '.csv, .tsv, .txt';
  sourceType = '';
  contents = '';
  ngModelOptions: { standalone: boolean };
  error: ErrorInfo = {};
  lines: string[] | undefined;
  csvHeaders: string[] | undefined;
  csvHeadersLine: string | undefined;
  file_name = '';
  fileUploadInstructions = '';
  uploading = false;
  validFile = false;
  createMode = false;

  // local copy of selected column types to allow users to temporarily select the same
  // column type more than once
  codeColumnIndexArray : number[] = [];
  targetCodeColumnIndexArray : number[] = [];
  targetDisplayColumnIndexArray : number[] = [];
  relationshipColumnIndexArray : number[] = [];
  noMapFlagColumnIndexArray : number[] = [];
  statusColumnIndexArray : number[] = [];

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              public dialogRef: MatDialogRef<MappingImportComponent>,
              public translate: TranslateService,
              private store: Store<IAppState>,
              @Inject(MAT_DIALOG_DATA) public data: {
                source: MappingImportSource,
                createMode: boolean
              }) {
    dialogRef.disableClose = true;
    this.ngModelOptions = {standalone: true};
    this.MAXFILESIZE = this.config.maxFileSize;
  }

  ngOnDestroy(): void {
    this.error = {};
    this.uploading = false;
  }

  ngOnInit(): void {
    const self = this;
    self.csvHeaders = undefined;
    self.csvHeadersLine = undefined;
    self.lines = undefined;
    if (self.data.createMode) {
      self.createMode = self.data.createMode;
    }
    if (self.translate) {
      self.getInstructions();
      self.translate.get('SOURCE.NO_FILE').subscribe((t) => this.file_name = t);
    }
  }

  isCorrectDelimiter(): boolean {
    if (this.csvHeadersLine && this.data.source.delimiter) {
      if (this.csvHeadersLine.indexOf(this.data.source.delimiter) === -1) {
        return false;
      }
      return true;
    }
    return true;
  }

  onFileSelected(event: any): void {

    this.clearFields(); // incase user selects a subsequent file before importing

    const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
    this.csvHeaders = undefined;
    this.lines = undefined;
    this.csvHeadersLine = undefined;
    if (fileUpload && fileUpload.files && fileUpload.files.length > 0) {
      if (event && event.type !== 'input') {
        this.data.source.delimiter = null;
      }
      const source_file: File = fileUpload.files[0];
      const idx = source_file.name.lastIndexOf('.');
      this.sourceType = source_file.name.substr(idx + 1).toUpperCase();
      const mime_type = ServiceUtils.toMime(this.sourceType);
      if (source_file.size > this.MAXFILESIZE) {
        this.translate.get('ERROR.FILE_EXCEEDS_MAX_SIZE').subscribe(
          (t) => this.error.message = `${t}. ${this.fileUploadInstructions}`);
      } else if (null == mime_type) {
        this.translate.get('ERROR.FILE_TYPE_NOT_SUPPORTED').subscribe(
          (t) => this.error.message = `${t}. ${this.fileUploadInstructions}`);
      } else {
        this.error = {};
        this.data.source.source_file = source_file;
        this.file_name = source_file.name;
        this.translate.get('SOURCE.FILE').subscribe(
          (t) => this.fileUploadInstructions = `${t}: ${this.sourceType} | ${ServiceUtils.bytesToMB(source_file.size)}`);
        const fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          try {
            this.contents = fileReader.result?.slice(0, 1024 * 4) as string;
            let lines = this.contents.split(ServiceUtils.getEOL());
            lines = lines.filter(line => line.length >= 1); // remove any empty rows
            this.lines = lines;
            const firstLine = lines.slice(0,1)[0]; //lines.shift(); .. show header line in preview
            if (!this.data.source.delimiter && event.type === 'change') {
              this.data.source.delimiter = firstLine && firstLine.indexOf('\t') > 0 ? '\t'
                  : firstLine && firstLine.indexOf(',') > 0 ? ','
                  : firstLine && firstLine.indexOf(';') > 0 ? ';'
                  : null;
            }
            if (lines.length > 1 && firstLine && this.data.source.delimiter) {
              this.csvHeadersLine =  firstLine;
              let headersFound : string[] = []; 
              // filter removes empty values that may be there due to trailing tabs
              this.csvHeaders = firstLine.split(this.data.source.delimiter).filter(header => header.trim() !== "").map(header => {
                let trimmedHeader = header.trim();
                
                // deal with files with no headers and duplicated values
                let timesFound = headersFound.filter(header => header === trimmedHeader).length
                if (timesFound > 0) { 
                  trimmedHeader = trimmedHeader + "_" + (timesFound+1);
                }
                headersFound.push(trimmedHeader);

                return trimmedHeader;
              });

              this.translate.get('IMPORT.IMPORT_COL_NOT_SPECIFIED').subscribe(
                (t) => this.csvHeaders?.push("-- " + t + " --"));

              this.data.source.codeColumnIndex = this.getDropdownDefaultIndex(this.SOURCE_CODE_OPTION_VALUE);
              this.data.source.targetCodeColumnIndex = this.getDropdownDefaultIndex(this.TARGET_CODE_OPTION_VALUE);
              this.data.source.targetDisplayColumnIndex = this.getDropdownDefaultIndex(this.TARGET_DISPLAY_OPTION_VALUE);
              this.data.source.relationshipColumnIndex = this.getDropdownDefaultIndex(this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE);
              this.data.source.noMapFlagColumnIndex = this.getDropdownDefaultIndex(this.NO_MAP_FLAG_OPTION_VALUE);
              this.data.source.statusColumnIndex = this.getDropdownDefaultIndex(this.STATUS_OPTION_VALUE);

              this.data.source.hasHeader = true;
              this.validFile = true;
              this.displayedColumns = this.csvHeaders;

              // pre-select dropdowns at top of each column if possible
              for (let j= 0; j<this.displayedColumns.length; j++) {
                this.updateSelection2(this.getDropdownDefault(j), j);
              }

              for (let i=0; i<NUM_SAMPLE_LINES; i++) {
                let line = lines.shift();
                if (line) {
                  const splitLine = line.split(this.data.source.delimiter).map(header => header.trim());
                  let rowObject: {[key: string]: string} = {};
                  let index = 0;
                  splitLine.forEach( column => {
                    rowObject[index.toString()] = column;
                    index++;
                  });
                  this.dataSource.push(rowObject);
                }
              }
            } 
            else if (lines.length <= 1) {
              this.translate.get('ERROR.FILE_EMPTY').subscribe((msg) => this.error.message = msg);
              this.clearFields();
            }
            else {
              this.translate.get('ERROR.FILE_CONTENTS_INVALID').subscribe((msg) => this.error.message = msg);
              this.clearFields();
            }
          } catch (error) {
            this.translate.get('ERROR.OPENING_FILE').subscribe(
              (msg) => this.error.message = msg);
            this.clearFields();
          }
        };
        fileReader.readAsText(source_file, 'UTF-8');
        this.clearFields();
      }
    }
  }

  /**
   * For dropdown column UI (simple)
   * @param columnType accepts one of const SOURCE_CODE_OPTION_VALUE, TARGET_CODE_OPTION_VALUE, TARGET_DISPLAY_OPTION_VALUE, RELATIONSHIP_TYPE_CODE_OPTION_VALUE, 
   * NO_MAP_FLAG_OPTION_VALUE, STATUS_OPTION_VALUE;
   * @returns the index in this.csvHeaders that columnType corresponds to, otherwise, the highest index in this.csvHeaders which is 
   * expected to be "not selected". returns null if this.csvHeaders !== true
   */
  getDropdownDefaultIndex(columnType: string) {

    if (this.csvHeaders) {

      let notSelectedIndex = this.csvHeaders.length - 1;
      let defaultIndex;

      switch(columnType) {
        case (this.SOURCE_CODE_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === SOURCE_CODE_OPTION_LABEL.toLowerCase()) || element.toLowerCase() === (ALT_SOURCE_CODE_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        case (this.TARGET_CODE_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === TARGET_CODE_OPTION_LABEL.toLowerCase()) || element.toLowerCase() === (ALT_TARGET_CODE_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        case (this.TARGET_DISPLAY_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === TARGET_DISPLAY_OPTION_LABEL.toLowerCase()) || element.toLowerCase() === (ALT_TARGET_DISPLAY_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        case (this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === RELATIONSHIP_TYPE_CODE_OPTION_LABEL.toLowerCase()) || element.toLowerCase() === (ALT_RELATIONSHIP_TYPE_CODE_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        case (this.NO_MAP_FLAG_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === NO_MAP_FLAG_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        case (this.STATUS_OPTION_VALUE): {
          let index = this.csvHeaders.findIndex(element => {
            return (element.toLowerCase() === STATUS_OPTION_LABEL.toLowerCase());
          });
          defaultIndex = index;
          break;
        }
        default: { 
          defaultIndex = -1;
          break; 
       } 
      }

      if (defaultIndex == -1) {
        return notSelectedIndex;
      }
      else {
        return defaultIndex;
      }
    }

    return null;

  }

  /**
   * For file preview UI (advanced, currently not displayed)
   * @param i 
   * @returns 
   */
  getDropdownDefault(i: number) : string {

    if (this.csvHeaders) {
    
      let fileColHeader = this.csvHeaders[i];
      
      switch(fileColHeader.toLowerCase()) { 
        case SOURCE_CODE_OPTION_LABEL.toLowerCase():
        case ALT_SOURCE_CODE_OPTION_LABEL: { 
          return this.SOURCE_CODE_OPTION_VALUE; 
        } 
        // case SOURCE_DISPLAY_OPTION_LABEL.toLowerCase(): { 
        //    return SOURCE_DISPLAY_OPTION_VALUE;
        // } 
        case TARGET_CODE_OPTION_LABEL.toLowerCase():
        case ALT_TARGET_CODE_OPTION_LABEL: { 
          return this.TARGET_CODE_OPTION_VALUE;
        } 
        case TARGET_DISPLAY_OPTION_LABEL.toLowerCase():
        case ALT_TARGET_DISPLAY_OPTION_LABEL: {
          return this.TARGET_DISPLAY_OPTION_VALUE;
        } 
        case RELATIONSHIP_TYPE_CODE_OPTION_LABEL.toLowerCase():
        case ALT_RELATIONSHIP_TYPE_CODE_OPTION_LABEL: { 
          return this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE;
        } 
        case NO_MAP_FLAG_OPTION_LABEL.toLowerCase(): {
          return this.NO_MAP_FLAG_OPTION_VALUE;
        }
        case STATUS_OPTION_LABEL.toLowerCase(): {
          return this.STATUS_OPTION_VALUE;
        }
        default: { 
           break; 
        } 
      } 
    }

    return '';
  }

  /**
   * For dropdown column UI (simple)
   * @param $event 
   * @param columnHeader 
   */
  updateSelection3($event : MatSelectChange, columnHeader : string): void {

    this.error.message = "";

    let notSelectedIndex = this.csvHeaders!.length - 1;

    switch(columnHeader) { 
      case this.SOURCE_CODE_OPTION_VALUE: { 
        this.codeColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.codeColumnIndexArray.push($event.value);
        }
        break; 
      } 
      case this.TARGET_CODE_OPTION_VALUE: { 
        this.targetCodeColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.targetCodeColumnIndexArray.push($event.value);
        }
        break;
      } 
      case this.TARGET_DISPLAY_OPTION_VALUE: { 
        this.targetDisplayColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.targetDisplayColumnIndexArray.push($event.value);
        }
        break;
      } 
      case this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE: { 
        this.relationshipColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.relationshipColumnIndexArray.push($event.value);
        }
        break;
      } 
      case this.NO_MAP_FLAG_OPTION_VALUE: {
        this.noMapFlagColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.noMapFlagColumnIndexArray.push($event.value);
        }
        break;
      }
      case this.STATUS_OPTION_VALUE: {
        this.statusColumnIndexArray.splice(0);
        if ($event.value < notSelectedIndex) {
          this.statusColumnIndexArray.push($event.value);
        }
        break;
      }
      default: { 
         break; 
      } 
    } 

    // inform user of multiple assignment of column type and prevent file upload
    let concatArrays = this.codeColumnIndexArray.concat(this.targetCodeColumnIndexArray, this.targetDisplayColumnIndexArray, this.relationshipColumnIndexArray, this.noMapFlagColumnIndexArray, this.statusColumnIndexArray)
    let duplicatedValues = concatArrays.filter((e, i, a) => a.indexOf(e) !== i)
    if (duplicatedValues.length > 0) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: this.csvHeaders![duplicatedValues[0]]}).subscribe((msg) => {
        this.error.message = msg;
      })
    }

    if (this.error.message === "") {
      // inform user of missing required columns and prevent file upload
      if (this.codeColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: SOURCE_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.targetCodeColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: TARGET_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.targetDisplayColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: TARGET_DISPLAY_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.relationshipColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: RELATIONSHIP_TYPE_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
    }

  }

  /**
   * For file preview UI (advanced, currently not displayed)
   * @param newValue 
   * @param index 
   */
  updateSelection2(newValue : string, index : number): void {
    
    this.error.message = "";

    // remove previous selection
    if (this.codeColumnIndexArray.includes(index)) { 
      const arrayIndex = this.codeColumnIndexArray.indexOf(index);
      this.codeColumnIndexArray.splice(arrayIndex, 1);
    } 
    else if (this.targetCodeColumnIndexArray.includes(index)) {
      const arrayIndex = this.targetCodeColumnIndexArray.indexOf(index);         
      this.targetCodeColumnIndexArray.splice(arrayIndex, 1);
    }
    else if (this.targetDisplayColumnIndexArray.includes(index)) {
      const arrayIndex = this.targetDisplayColumnIndexArray.indexOf(index);
      this.targetDisplayColumnIndexArray.splice(arrayIndex, 1);
    }
    else if (this.relationshipColumnIndexArray.includes(index)) { 
      const arrayIndex = this.relationshipColumnIndexArray.indexOf(index);
      this.relationshipColumnIndexArray.splice(arrayIndex, 1);
    }
    else if (this.noMapFlagColumnIndexArray.includes(index)) {
      const arrayIndex = this.noMapFlagColumnIndexArray.indexOf(index);
      this.noMapFlagColumnIndexArray.splice(arrayIndex, 1);
    }
    else if (this.statusColumnIndexArray.includes(index)) {
      const arrayIndex = this.statusColumnIndexArray.indexOf(index);
      this.statusColumnIndexArray.splice(arrayIndex, 1);
    }

    console.log("newValue", newValue);
    switch(newValue) { 
      case this.SOURCE_CODE_OPTION_VALUE: { 
        this.codeColumnIndexArray.push(index);
        break;
      } 
      // this field is currently not used
      // case SOURCE_DISPLAY_OPTION_VALUE: { 
      //   break;
      // } 
      case this.TARGET_CODE_OPTION_VALUE: { 
        this.targetCodeColumnIndexArray.push(index);
        break;
      } 
      case this.TARGET_DISPLAY_OPTION_VALUE: {
        this.targetDisplayColumnIndexArray.push(index);
        break;
      } 
      case this.RELATIONSHIP_TYPE_CODE_OPTION_VALUE: { 
        console.log("adding to exists 2");
        this.relationshipColumnIndexArray.push(index);
        break;
      } 
      case this.NO_MAP_FLAG_OPTION_VALUE: {
        this.noMapFlagColumnIndexArray.push(index);
        break;
      }
      case this.STATUS_OPTION_VALUE: {
        this.statusColumnIndexArray.push(index);
        break;
      }
      default: { 
        // undefined = empty selection
         break; 
      } 

    }

    // inform user of multiple assignment of column type and prevent file upload
    if (this.codeColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: SOURCE_CODE_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }
    else if (this.targetCodeColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: TARGET_CODE_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }
    else if (this.targetDisplayColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: TARGET_DISPLAY_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }
    else if (this.relationshipColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: RELATIONSHIP_TYPE_CODE_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }
    else if (this.noMapFlagColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: NO_MAP_FLAG_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }
    else if (this.statusColumnIndexArray.length > 1) {
      this.translate.get('ERROR.IMPORT_COLUMN_DUPLICATED', {col: STATUS_OPTION_LABEL}).subscribe((msg) => {
        this.error.message = msg;
      })
    }

    if (this.error.message === "") {
      // inform user of missing required columns and prevent file upload
      if (this.codeColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: SOURCE_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.targetCodeColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: TARGET_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.targetDisplayColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: TARGET_DISPLAY_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
      else if (this.relationshipColumnIndexArray.length < 1) {
        this.translate.get('ERROR.IMPORT_COLUMN_MISSING', {col: RELATIONSHIP_TYPE_CODE_OPTION_LABEL}).subscribe((msg) => {
          this.error.message = msg;
        })
      }
    }
    
  }

  updateSelection($event : MatSelectChange, index : number): void {
    this.updateSelection2($event.value, index);
  }

  onSubmit(): void {

    // copy from local version (arrays) into the MappingImportSource
    this.data.source.codeColumnIndex = this.codeColumnIndexArray[0];
    this.data.source.targetCodeColumnIndex = this.targetCodeColumnIndexArray[0];
    this.data.source.targetDisplayColumnIndex = this.targetDisplayColumnIndexArray[0];
    this.data.source.relationshipColumnIndex = this.relationshipColumnIndexArray[0];

    // copy over optional columns if they are present
    if (this.noMapFlagColumnIndexArray.length > 0) {
      this.data.source.noMapFlagColumnIndex = this.noMapFlagColumnIndexArray[0];
    }
    else {
      this.data.source.noMapFlagColumnIndex = null;
    }
    if (this.statusColumnIndexArray.length > 0) {
      this.data.source.statusColumnIndex = this.statusColumnIndexArray[0];
    }
    else {
      this.data.source.statusColumnIndex = null;
    }

    if (this.data.source.source_file == null) {
      this.translate.get('SOURCE.FILE_REQUIRED').subscribe((msg) => this.error.message = msg);
    // retired, api to perform
    // } else if (ServiceUtils.hasDuplicateCodes(this.contents, this.data.source, this.sourceType)) {
    //   this.translate.get('ERROR.FILE_CONTENTS_DUPLICATES_SOURCE_AND_TARGET').subscribe((msg) => this.error.message = msg);
    } else {
      this.error = {};
      this.store.dispatch(new SelectMappingFile({source: this.data.source, sourceType: this.sourceType}));
      this.dialogRef.close();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // resultSelector function for MergeMap is deprecated and has been replaced with nested map operators
  // https://rxjs.dev/deprecations/resultSelector
  getInstructions(): void {
    if (this.translate) {
      const i1$ = this.translate.get('SOURCE.IMPORT_TYPES');
      const i2$ = this.translate.get('SOURCE.MAX_FILE_SIZE').pipe(
        map((t) => `${t}: ${ServiceUtils.bytesToMB(this.MAXFILESIZE)}`));

      i1$.pipe(
        mergeMap((outerValue) => i2$.pipe(
          map((innerValue) => `${outerValue}. ${innerValue}`)
        ))
      ).subscribe(
        (t) => this.fileUploadInstructions = `${t}`);
    }
  }

  disableSubmit(): boolean {
    return !this.validFile || (typeof this.error.message !== "undefined" && this.error.message !== "");
  }

  clearFields(clearFileName?: boolean): void {
    this.csvHeadersLine =  undefined;
    this.csvHeaders = undefined;
    this.validFile = false;
    this.contents = '';
    if (clearFileName) {
      this.translate.get('SOURCE.NO_FILE').subscribe((t) => this.file_name = t);
    }
    this.getInstructions();
    this.lines = [];
    this.data.source.delimiter = null;

    this.codeColumnIndexArray = [];
    this.targetCodeColumnIndexArray = [];
    this.targetDisplayColumnIndexArray = [];
    this.relationshipColumnIndexArray = [];
    this.noMapFlagColumnIndexArray = [];
    this.statusColumnIndexArray = [];
    this.dataSource = [];
  }

  ngAfterViewChecked(): void {
    // Render [TAB] instead of the actucal tab character
    if (this.data.source.delimiter === '\t') {
      const delim = document.getElementById('delimiter') as HTMLInputElement;
      delim.value = '[TAB]';
    }
  }

}
