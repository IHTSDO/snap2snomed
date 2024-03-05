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

import {AfterViewChecked, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {Source} from '../../_models/source';
import {TranslateService} from '@ngx-translate/core';
import {map, mergeMap} from 'rxjs/operators';
import {ServiceUtils} from '../../_utils/service_utils';
import {ImportSource} from '../../store/source-feature/source.actions';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {selectSourceList, selectSourceState} from '../../store/source-feature/source.selectors';
import {SourceService} from '../../_services/source.service';
import {APP_CONFIG, AppConfig} from '../../app.config';
import {ErrorInfo} from '../../errormessage/errormessage.component';


@Component({
  selector: 'app-source-import',
  templateUrl: './source-import.component.html',
  styleUrls: ['./source-import.component.css']
})
export class SourceImportComponent implements OnInit, OnDestroy, AfterViewChecked{

  private readonly MAXFILESIZE: number;
  readonly MAX_NAME = 100;
  readonly MAX_VERSION = 30;
  readonly MAX_CODESYSTEM = 255;
  readonly MAX_VALUESET = 255;
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
  initialSourceList: Source[] = [];
  saved = false;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private router: Router,
              public dialogRef: MatDialogRef<SourceImportComponent>,
              public translate: TranslateService,
              private sourceService: SourceService,
              private store: Store<IAppState>,
              @Inject(MAT_DIALOG_DATA) public data: Source) {
    this.ngModelOptions = {standalone: true};
    this.MAXFILESIZE = this.config.maxFileSize;
  }

  ngOnDestroy(): void {
    this.error = {};
    this.uploading = false;
    this.saved = false;
  }

  ngOnInit(): void {
    const self = this;
    self.csvHeaders = undefined;
    self.csvHeadersLine = undefined;
    self.lines = undefined;
    if (self.translate) {
      self.getInstructions();
      self.translate.get('SOURCE.NO_FILE').subscribe((t) => this.file_name = t);
      self.store.select(selectSourceState).subscribe((state) => {
        if (state.errorMessage !== null) {
          self.error.detail = state.errorMessage.error;
          self.translate.get('ERROR.IMPORT_SOURCE').subscribe((res: string) => {
            self.error.message = res;
          });
        }
        self.uploading = state.isLoading;
        self.saved = !!state.selectedSource;
        if (self.saved) {
          self.onClose(true);
        }
      });
    }
    self.store.select(selectSourceList).subscribe((res) => this.initialSourceList = res).unsubscribe();
  }

  // required because this.data.additionalColumnIndexes is a primative type
  trackByIdx(index: number, obj: any): any {
    return index;
  }

  onAddAdditionalColumn() {
    this.data.additionalColumnIndexes.push(null);
    this.data.additionalColumnTypes.push(null);
  }

  onRemoveAdditionalColumn(index : number) {
    this.data.additionalColumnIndexes.splice(index, 1);
    this.data.additionalColumnTypes.splice(index, 1);
  }

  onFileSelected(event: any): void {
    const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
    this.csvHeaders = undefined;
    this.lines = undefined;
    this.csvHeadersLine = undefined;
    if (fileUpload && fileUpload.files && fileUpload.files.length > 0) {
      if (event && event.type !== 'input') {
        this.data.delimiter = null;
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
        this.data.source_file = source_file;
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
            if (!this.data.delimiter && event.type === 'change') {
              this.data.delimiter = firstLine && firstLine.indexOf('\t') > 0 ? '\t'
                  : firstLine && firstLine.indexOf(',') > 0 ? ','
                  : firstLine && firstLine.indexOf(';') > 0 ? ';'
                  : null;
            }
            if (lines.length > 1 && firstLine) {
              this.csvHeadersLine =  firstLine;
              if (this.data.delimiter) {
                this.csvHeaders = firstLine.split(this.data.delimiter);
              } else {
                this.csvHeaders = [firstLine.trim()]; // Remove Windows \r from header to be displayed
              }
              // Defaults
              this.data.hasHeader = true;
              this.data.codeColumnIndex = 0;
              if (this.csvHeaders) {
                this.data.displayColumnIndex = this.csvHeaders.length > 1 ? 1 : 0;
              }
              this.data.additionalColumnIndexes = [];
              this.data.additionalColumnTypes = [];
            } else {
              this.translate.get('ERROR.FILE_CONTENTS_INVALID').subscribe((msg) => this.error.message = msg);
            }
          } catch (error) {
            this.translate.get('ERROR.OPENING_FILE').subscribe(
              (msg) => this.error.message = msg);
          }
        };
        fileReader.readAsText(source_file, 'UTF-8');
      }
    }
  }

  /** Source list shows name and version for selection so cannot have duplicate name-version */
  private hasDuplicateNameVersion(): boolean {
    const filtered = this.initialSourceList.filter((source: Source) =>
      source.name === this.data.name && source.version === this.data.version);
    return filtered.length > 0;
  }

  onSubmit(): void {
    if (this.data.source_file == null) {
      this.translate.get('SOURCE.FILE_REQUIRED').subscribe((msg) => this.error.message = msg);
    } else if (ServiceUtils.hasDuplicateCodes(this.contents, this.data, this.sourceType)) {
      this.translate.get('ERROR.FILE_CONTENTS_DUPLICATES').subscribe((msg) => this.error.message = msg);
    } else if (this.hasDuplicateNameVersion()) {
      this.translate.get('SOURCE.NAME_DUPLICATE').subscribe((msg) => this.error.message = msg);
    } else if (!this.saved) {
      this.error = {};
      this.store.dispatch(new ImportSource({source: this.data, sourceType: this.sourceType}));
    }
  }

  /** 
   * @param saved false if 'close' clicked (i.e. dialog cancelled), true otherwise  ('save' clicked)
   */
  onClose(saved : boolean): void {
    this.dialogRef.close(saved);
  }

  // TODO: Mergemap is deprecated find another way to do this
  getInstructions(): void {
    if (this.translate) {
      const i1$ = this.translate.get('SOURCE.IMPORT_TYPES');
      const i2$ = this.translate.get('SOURCE.MAX_FILE_SIZE').pipe(
        map((t) => `${t}: ${ServiceUtils.bytesToMB(this.MAXFILESIZE)}`));

      i1$.pipe(mergeMap(value => i2$, (outerValue, innerValue) => `${outerValue}. ${innerValue}`)).subscribe(
        (t) => this.fileUploadInstructions = `${t}`);
    }
  }

  /**
   * If an additional column is supplied, check that a type is also supplied
   */
  allTypeFieldsSupplied() : boolean {
    for (let i=0; i< this.data.additionalColumnIndexes.length; i++) {
      if (!this.data.additionalColumnIndexes[i]) {
        return false;
      }
      if (this.data.additionalColumnIndexes[i]) {
        if (!this.data.additionalColumnTypes[i]) {
          return false;
        }
      }
    };
    return true
  }

  disableSubmit(): boolean {
    return !(this.data.name && this.data.version && this.data.source_file && this.allTypeFieldsSupplied()) || this.error.message !== undefined;
  }

  changeDelimiter(event: any): void {
    this.csvHeaders = undefined;
    this.lines = undefined;
    this.csvHeadersLine = undefined;
    const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileUpload && fileUpload.files) {
      this.data.delimiter = event.data;
      this.onFileSelected(event);
    } else {
      fileUpload.value = '';
      fileUpload.files = null;
      this.file_name = '';
      this.ngOnInit();
    }
  }

  setTabDelimiter(): void {
    this.setDelimiter('\t');
  }

  setNullDelimiter(): void {
    this.setDelimiter(null);
  }

  setDelimiter(delimiter: string | null): void {
    this.data.delimiter = delimiter;
    const delim = document.getElementById('delimiter') as HTMLInputElement;
    this.changeDelimiter({data: delimiter, type: 'input', target: document.getElementById('delimiter') as HTMLInputElement});
  }

  isCorrectDelimiter(): boolean {
    if (this.csvHeadersLine && this.data.delimiter) {
      if (this.csvHeadersLine.indexOf(this.data.delimiter) === -1) {
        return false;
      }
      return true;
    }
    return true;
  }

  ngAfterViewChecked(): void {
    // Render [TAB] instead of the actucal tab character
    if (this.data.delimiter === '\t') {
      const delim = document.getElementById('delimiter') as HTMLInputElement;
      delim.value = '[TAB]';
    }
  }

}
