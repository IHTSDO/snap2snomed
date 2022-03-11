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

export interface HeaderDetails {
  source_code_col_index: number;
  target_code_col__index: number;
  target_display_col__index: number;
  relationship_col__index: number;
}

@Component({
  selector: 'app-mapping-import',
  templateUrl: './mapping-import.component.html',
  styleUrls: ['./mapping-import.component.css', '../../source/source-import/source-import.component.css'],
})
export class MappingImportComponent implements OnInit, OnDestroy, AfterViewChecked {

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
            const firstLine = lines.shift();
            if (!this.data.source.delimiter && event.type === 'change') {
              this.data.source.delimiter = firstLine && firstLine.indexOf('\t') > 0 ? '\t'
                  : firstLine && firstLine.indexOf(',') > 0 ? ','
                  : firstLine && firstLine.indexOf(';') > 0 ? ';'
                  : null;
            }
            if (lines.length > 1 && firstLine && this.data.source.delimiter) {
              this.csvHeadersLine =  firstLine;
              this.csvHeaders = firstLine.split(this.data.source.delimiter).map(header => header.trim());
              // The file must be with headers and in the format of
              // source_code, target_code, target_display, relationship or
              // Source code, Source display, Target code, Target display, Relationship type code
              const headerDetails: HeaderDetails | undefined = this.getHeaderDetails(this.csvHeaders);
              if (headerDetails) {
                this.data.source.hasHeader = true;
                this.data.source.codeColumnIndex = headerDetails.source_code_col_index;
                this.data.source.targetCodeColumnIndex = headerDetails.target_code_col__index;
                this.data.source.targetDisplayColumnIndex = headerDetails.target_display_col__index;
                this.data.source.relationshipColumnIndex = headerDetails.relationship_col__index;
                this.validFile = true;
              } else {
                this.translate.get('ERROR.FILE_CONTENTS_INVALID').subscribe((msg) => this.error.message = msg);
                this.clearFields(false);
              }
            } else {
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

  getHeaderDetails(headers: string[]): HeaderDetails | undefined{
    if (headers.length === 4 && headers[0] === 'source_code'
      && headers[1] === 'target_code' && headers[2] === 'target_display'
      && headers[3] === 'relationship') {
        return {
          source_code_col_index: 0,
          target_code_col__index: 1,
          target_display_col__index: 2,
          relationship_col__index: 3,
        };
    } else if (
    headers[0] === 'Source code'
    && headers[2] === 'Target code' && headers[3] === 'Target display'
    && headers[4] === 'Relationship type code') {
      return {
        source_code_col_index: 0,
        target_code_col__index: 2,
        target_display_col__index: 3,
        relationship_col__index: 4,
      };
    }
    return undefined;
  }

  onSubmit(): void {
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
    return !this.validFile;
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
  }

  ngAfterViewChecked(): void {
    // Render [TAB] instead of the actucal tab character
    if (this.data.source.delimiter === '\t') {
      const delim = document.getElementById('delimiter') as HTMLInputElement;
      delim.value = '[TAB]';
    }
  }

}
