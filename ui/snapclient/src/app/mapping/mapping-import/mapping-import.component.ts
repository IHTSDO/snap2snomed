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

const SOURCE_CODE_OPTION_VALUE = 'sourceCode';
const SOURCE_DISPLAY_OPTION_VALUE = 'sourceDisplay';
const TARGET_CODE_OPTION_VALUE = 'targetCode';
const TARGET_DISPLAY_OPTION_VALUE = 'targetDisplay';
const RELATIONSHIP_TYPE_CODE_OPTION_VALUE = 'relationshipTypeCode';
const NO_MAP_FLAG_OPTION_VALUE = 'noMapFlag';
const STATUS_OPTION_VALUE = "status";

const NUM_SAMPLE_LINES = 3;

@Component({
  selector: 'app-mapping-import',
  templateUrl: './mapping-import.component.html',
  styleUrls: ['./mapping-import.component.css', '../../source/source-import/source-import.component.css'],
})
export class MappingImportComponent implements OnInit, OnDestroy, AfterViewChecked {

  displayedColumns: string[] = [];
  dataSource : {[key: string]: string}[] = [];

  columns: RowColumn[] = [
    {value: SOURCE_CODE_OPTION_VALUE, viewValue: SOURCE_CODE_OPTION_LABEL},
//    {value: SOURCE_DISPLAY_OPTION_VALUE, viewValue: SOURCE_DISPLAY_OPTION_LABEL},
    {value: TARGET_CODE_OPTION_VALUE, viewValue: TARGET_CODE_OPTION_LABEL},
    {value: TARGET_DISPLAY_OPTION_VALUE, viewValue: TARGET_DISPLAY_OPTION_LABEL},
    {value: RELATIONSHIP_TYPE_CODE_OPTION_VALUE, viewValue: RELATIONSHIP_TYPE_CODE_OPTION_LABEL},
    {value: NO_MAP_FLAG_OPTION_VALUE, viewValue: NO_MAP_FLAG_OPTION_LABEL},
    {value: STATUS_OPTION_VALUE, viewValue: STATUS_OPTION_LABEL},
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
            const lines = this.contents.split(ServiceUtils.getEOL());
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
              this.csvHeaders = firstLine.split(this.data.source.delimiter).map(header => {
                let trimmedHeader = header.trim();
                
                // deal with files with no headers and duplicated values
                let timesFound = headersFound.filter(header => header === trimmedHeader).length
                if (timesFound > 0) { 
                  trimmedHeader = trimmedHeader + "_" + (timesFound+1);
                }
                headersFound.push(trimmedHeader);

                return trimmedHeader
              });

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

  getDropdownDefault(i: number) : string {

    if (this.csvHeaders) {
    
      let fileColHeader = this.csvHeaders[i];
      
      switch(fileColHeader.toLowerCase()) { 
        case (SOURCE_CODE_OPTION_LABEL.toLowerCase() || ALT_SOURCE_CODE_OPTION_LABEL): { 
          return SOURCE_CODE_OPTION_VALUE; 
        } 
        // case SOURCE_DISPLAY_OPTION_LABEL.toLowerCase(): { 
        //    return SOURCE_DISPLAY_OPTION_VALUE;
        // } 
        case (TARGET_CODE_OPTION_LABEL.toLowerCase() || ALT_TARGET_CODE_OPTION_LABEL): { 
          return TARGET_CODE_OPTION_VALUE;
        } 
        case (TARGET_DISPLAY_OPTION_LABEL.toLowerCase() || ALT_TARGET_DISPLAY_OPTION_LABEL): {
          return TARGET_DISPLAY_OPTION_VALUE;
        } 
        case (RELATIONSHIP_TYPE_CODE_OPTION_LABEL.toLowerCase() || ALT_RELATIONSHIP_TYPE_CODE_OPTION_LABEL): { 
          return RELATIONSHIP_TYPE_CODE_OPTION_VALUE;
        } 
        case NO_MAP_FLAG_OPTION_LABEL.toLowerCase(): {
          return NO_MAP_FLAG_OPTION_VALUE;
        }
        case STATUS_OPTION_LABEL.toLowerCase(): {
          return STATUS_OPTION_VALUE;
        }
        default: { 
           break; 
        } 
      } 
    }

    return '';
  }

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

    switch(newValue) { 
      case SOURCE_CODE_OPTION_VALUE: { 
        this.codeColumnIndexArray.push(index);
        break;
      } 
      // this field is currently not used
      // case SOURCE_DISPLAY_OPTION_VALUE: { 
      //   break;
      // } 
      case TARGET_CODE_OPTION_VALUE: { 
        this.targetCodeColumnIndexArray.push(index);
        break;
      } 
      case TARGET_DISPLAY_OPTION_VALUE: {
        this.targetDisplayColumnIndexArray.push(index);
        break;
      } 
      case RELATIONSHIP_TYPE_CODE_OPTION_VALUE: { 
        this.relationshipColumnIndexArray.push(index);
        break;
      } 
      case NO_MAP_FLAG_OPTION_VALUE: {
        this.noMapFlagColumnIndexArray.push(index);
        break;
      }
      case STATUS_OPTION_VALUE: {
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
      else if (this.relationshipColumnIndexArray.length < 1) {TARGET_DISPLAY_OPTION_LABEL
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
    } else if (ServiceUtils.hasDuplicateCodes(this.contents, this.data.source, this.sourceType)) {
      this.translate.get('ERROR.FILE_CONTENTS_DUPLICATES_SOURCE_AND_TARGET').subscribe((msg) => this.error.message = msg);
    } else {
      this.error = {};
      this.store.dispatch(new SelectMappingFile({source: this.data.source, sourceType: this.sourceType}));
      this.dialogRef.close();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // TODO:  resultSelector function for MergeMap is deprecated.
  // https://rxjs.dev/deprecations/resultSelector
  // Find another way to do this
  getInstructions(): void {
    if (this.translate) {
      const i1$ = this.translate.get('SOURCE.IMPORT_TYPES');
      const i2$ = this.translate.get('SOURCE.MAX_FILE_SIZE').pipe(
        map((t) => `${t}: ${ServiceUtils.bytesToMB(this.MAXFILESIZE)}`));

      i1$.pipe(mergeMap(value => i2$, (outerValue, innerValue) => `${outerValue}. ${innerValue}`)).subscribe(
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
