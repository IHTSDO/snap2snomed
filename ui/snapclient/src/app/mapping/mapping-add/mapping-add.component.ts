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

import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {AddMapping, CopyMapping, UpdateMapping} from '../../store/mapping-feature/mapping.actions';
import {TranslateService} from '@ngx-translate/core';
import {selectMappingError, selectMappingLoading} from '../../store/mapping-feature/mapping.selectors';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {Mapping} from '../../_models/mapping';
import {SourceImportComponent} from '../../source/source-import/source-import.component';
import {MatDialog} from '@angular/material/dialog';
import {selectMappingFile, selectSourceList, selectSourceState} from '../../store/source-feature/source.selectors';
import {ImportMappingFileParams, InitSelectedSource, LoadSources} from 'src/app/store/source-feature/source.actions';
import {Source} from 'src/app/_models/source';
import {FhirService, Version} from 'src/app/_services/fhir.service';
import {LoadVersions} from 'src/app/store/fhir-feature/fhir.actions';
import {selectFhirError, selectVersionList} from 'src/app/store/fhir-feature/fhir.selectors';
import {NgForm} from '@angular/forms';
import {cloneDeep} from 'lodash';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {FormUtils} from '../../_utils/form_utils';
import {MappingImportComponent} from '../mapping-import/mapping-import.component';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import {selectAuthorizedProjects} from '../../store/app.selectors';
import {Project} from '../../_models/project';

@Component({
  selector: 'app-mapping-add',
  templateUrl: './mapping-add.component.html',
  styleUrls: ['./mapping-add.component.css']
})
export class MappingAddComponent implements OnInit {
  private width = '600px';
  error: ErrorInfo = {};
  sources: Source[] = [];
  versions: Version[] = [];
  versionsLoaded = false;
  existingMapVersions: string[] | null = null;
  loading = false;
  @ViewChild('myForm') form: NgForm | undefined;
  mappingFile: ImportMappingFileParams | undefined | null;

  MAX_TITLE = FormUtils.MAX_TITLE;
  MAX_VERSION = FormUtils.MAX_VERSION;
  MAX_DESCRIPTION = FormUtils.MAX_DESCRIPTION;
  MAX_TARGETSCOPE = FormUtils.MAX_TARGETSCOPE;
  VALID_STRING_PATTERN = FormUtils.VALID_STRING_PATTERN;

  mappingModel!: Mapping;

  @Input() set mapping(value: Mapping) {
    if (value) {
      this.mappingModel = cloneDeep(value);
      // if target version no longer available - need to clear model
      if (!this.hasAvailableTargetVersion(this.mappingModel.toVersion) && this.versionsLoaded) {
        this.mappingModel.toVersion = '';
        this.mappingModel.toScope = '';
      }
      // get other map versions
      this.store.select(selectAuthorizedProjects).subscribe((projects) => {
        if (this.mappingModel?.project && this.mappingModel.project.id !== '') {
          const mapProject: Project[] = projects.filter((proj) => proj.id === this.mappingModel.project.id);
          this.existingMapVersions = mapProject[0] ? mapProject[0].maps.map((m) => m.mapVersion) : null;
        }
      }).unsubscribe();
    } else {
      this.newMapping();
    }
  }

  @Input() mode = 'FORM.CREATE';

  @Output() closed = new EventEmitter();

  constructor(
    private store: Store<IAppState>,
    private translate: TranslateService,
    private fhirService: FhirService,
    public dialog: MatDialog) {
  }

  ngOnInit(): void {
    const self = this;
    self.error = {};
    self.loadVersions();
    self.store.dispatch(new LoadSources());
    self.load();
  }

  private newMapping(): void {
    this.mappingModel = new Mapping();
    this.error = {};
    this.store.select(selectCurrentUser).subscribe((owner) => {
      if (owner) {
        if (this.mode === 'FORM.CREATE') {
          this.mappingModel.project.owners = [owner];
        }
      }
    });
  }

  private load(): void {
    const self = this;
    self.store.select(selectMappingLoading).subscribe((res) => this.loading = res);
    self.store.select(selectMappingFile).subscribe((res) => this.mappingFile = res);
    self.store.select(selectMappingError).subscribe((error) => {
      if (error !== null) {
        self.translate.get('ERROR.ADD_MAPPING').subscribe((res: string) => self.createOrAppendError(res));
        self.error.detail = error;
      }
    });
    self.store.select(selectSourceList).subscribe(
      data => this.sources = data,
      error => this.translate.get('ERROR.LOAD_SOURCES').subscribe((res) => self.createOrAppendError(res))
    );
    self.store.select(selectVersionList).subscribe(
      data => {
        this.versions = data;
        this.versionsLoaded = true;
      },
      error => this.translate.get('ERROR.LOAD_VERSIONS').subscribe((res) => self.createOrAppendError(res))
    );
    self.store.select(selectFhirError).subscribe((error) => {
      if (error != null) {
        self.translate.get('ERROR.BACKEND_ISSUES' ,{url: error.url}).subscribe((res: string) => self.createOrAppendError(res));
        self.error.detail = error;
      }
    });
  }

  onSubmit(): void {
    this.error = {};
    this.fhirService.validateEcl(this.mappingModel.toScope).subscribe(
      (result) => {
        if (result.valid) {
          if (this.mode === 'FORM.CREATE') {
            this.store.dispatch(new AddMapping({
              mapping: this.mappingModel,
              importFile: this.mappingFile
            }));
          } else if (this.mode === 'FORM.EDIT') {
            this.store.dispatch(new UpdateMapping(this.mappingModel));
          } else if (this.mode === 'FORM.COPY') {
            if (this.existingMapVersions) {
              if (this.existingMapVersions.indexOf(this.mappingModel.mapVersion) < 0) {
                this.store.dispatch(new CopyMapping(this.mappingModel));
              } else {
                this.translate.get('ERROR.EXISTING_VERSION').subscribe((res) => {
                  this.error.message = `${res}: ${this.existingMapVersions?.join(',')}`;
                });
              }
            } else {
              this.translate.get('ERROR.PROJECT_LOAD').subscribe((res) => {
                this.error.message = res;
              });
            }
          }
          // this.closed.emit();  // manually close to allow any errors to show
        } else {
          this.translate.get('MAP.TARGET_SCOPE_INVALID_ERROR').subscribe((res) => {
            this.error.message = res;
          });
        }
      }
    );
  }

  onCancel($event: Event, form: NgForm): void {
    $event.preventDefault();
    this.closed.emit();
    this.error = {};
  }

  addSource($event: MouseEvent): void {
    $event.preventDefault();
    this.store.dispatch(new InitSelectedSource());
    const dialogRef = this.dialog.open(SourceImportComponent, {
      width: this.width, data: new Source()
    });

    dialogRef.afterClosed().subscribe(
      (result: any) => {
        this.store.select(selectSourceState).subscribe((state) => {
          this.sources = state.sources;
          this.mappingModel.source = state.selectedSource ?? new Source();
        });
      });
  }

  loadVersions(): void {
    this.store.dispatch(new LoadVersions());
  }

  getFormModeTextForTranslation(): string {
    if (this.mode === 'FORM.VIEW') {
      return 'MAP.MAP_VIEW_DETAILS';
    } else if (this.mode === 'FORM.CREATE') {
      return 'MAP.MAP_ADD';
    } else if (this.mode === 'FORM.EDIT') {
      return 'MAP.MAP_EDIT';
    } else if (this.mode === 'FORM.COPY') {
      return 'MAP.MAP_COPY';
    } else {
      throw Error('Unknown mode ' + this.mode);
    }
  }

  onImportMapping($event: Event, form: NgForm): void {
    $event.preventDefault();
    const dialogRef = this.dialog.open(MappingImportComponent, {
      width: this.width, data: {
        source: new MappingImportSource(),
        createMode: true
      }
    });

    dialogRef.afterClosed().subscribe(
      (result: any) => {
        if (result instanceof ImportMappingFileParams) {
          this.mappingFile = result;
        }
      });
  }

  onClearSelectedMappingFile($event: Event, form: NgForm): void {
    this.mappingFile = undefined;
  }

  errorUpdate(event: any): void {
    if (event === null) {
      this.error = {};
    } else {
      this.error.message = event.msg ?? null;
      this.error.messages = undefined;
      this.error.detail = event.detail ?? null;
    }
  }

  private createOrAppendError(err: string): void {
    const self = this;
    if (!self.error.messages) {
      self.error.messages = [];
    }
    if (!self.error.messages.includes(err)) {
      self.error.messages.push(err);
    }
  }

  private hasAvailableTargetVersion(toVersion: string | null): boolean {
    if (toVersion && this.versions.length > 0) {
      return this.versions.map((v) => v.uri).indexOf(toVersion) >= 0;
    }
    return false;
  }
}
