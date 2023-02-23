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

import {Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {
  AddMapping,
  ClearErrors,
  CopyMapping,
  DeleteMapping,
  UpdateMapping
} from '../../store/mapping-feature/mapping.actions';
import {TranslateService} from '@ngx-translate/core';
import {
  selectAddEditMappingSuccess,
  selectMappingError,
  selectMappingLoading
} from '../../store/mapping-feature/mapping.selectors';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {Mapping} from '../../_models/mapping';
import {SourceImportComponent} from '../../source/source-import/source-import.component';
import {MatDialog} from '@angular/material/dialog';
import {selectMappingFile, selectSourceList, selectSourceState} from '../../store/source-feature/source.selectors';
import {ImportMappingFileParams, InitSelectedSource, LoadSources} from 'src/app/store/source-feature/source.actions';
import {Source} from 'src/app/_models/source';
import {FhirService, Release} from 'src/app/_services/fhir.service';
import {LoadReleases} from 'src/app/store/fhir-feature/fhir.actions';
import {selectFhirError, selectReleaseList} from 'src/app/store/fhir-feature/fhir.selectors';
import {NgForm} from '@angular/forms';
import {cloneDeep} from 'lodash';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {FormUtils} from '../../_utils/form_utils';
import {MappingImportComponent} from '../mapping-import/mapping-import.component';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import {selectAuthorizedProjects} from '../../store/app.selectors';
import {Project} from '../../_models/project';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-mapping-add',
  templateUrl: './mapping-add.component.html',
  styleUrls: ['./mapping-add.component.css']
})
export class MappingAddComponent implements OnInit {
  private width = '1000px';
  error: ErrorInfo = {};
  sources: Source[] = [];
  editionToVersionsMap: Map<string, Release[]> | undefined; // versions (often dates) indexed by edition (often a country)
  editionToVersionsMapLoaded = false;
  editionVersions: Release[] = []; // versions of the selected edition (often a country)
  existingMapVersions: string[] | null = null;
  loading = false;
  selectedEdition : string = "";
  @ViewChild('myForm') form: NgForm | undefined;
  mappingFile: ImportMappingFileParams | undefined | null;

  MAX_TITLE = FormUtils.MAX_TITLE;
  MAX_VERSION = FormUtils.MAX_VERSION;
  MAX_DESCRIPTION = FormUtils.MAX_DESCRIPTION;
  MAX_TARGETSCOPE = FormUtils.MAX_TARGETSCOPE;
  VALID_STRING_PATTERN = FormUtils.VALID_STRING_PATTERN;

  mappingModel!: Mapping;
  previousVersionSource: Source | undefined;
  warnDelete = false;

  @Input() set mapping(value: Mapping | undefined) {
    if (value) {
      this.mappingModel = cloneDeep(value);
      // if target version no longer available - need to clear model
      if (this.mappingModel.toVersion !== null && !this.hasAvailableTargetVersion(this.mappingModel.toVersion) && this.editionToVersionsMapLoaded) {
        this.mappingModel.toVersion = '';
        this.mappingModel.toScope = '';
      }
      else if (this.editionToVersionsMapLoaded && this.editionToVersionsMap) {
        // initialize to version (country and date)
        for (let [key, value] of this.editionToVersionsMap) {
          var result = value.filter(obj => {
            return obj.uri === this.mappingModel.toVersion
          })
          if (result.length > 0) {
            this.selectedEdition = key;
            this.editionVersions = value;
            break;
          }
        }
      }
      this.previousVersionSource = this.sources.find((source) => source.id === this.mappingModel.source.id);
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
  @Input() drawerOpen = false;

  @Output() closed = new EventEmitter();

  constructor(
    private elRef: ElementRef,
    private store: Store<IAppState>,
    private translate: TranslateService,
    private fhirService: FhirService,
    public dialog: MatDialog) {
  }

  ngOnInit(): void {
    const self = this;
    self.error = {};
    self.loadReleases();
    self.store.dispatch(new LoadSources());
    self.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // clear all errors when drawer is closed
    if (changes.drawerOpen && changes.drawerOpen.currentValue === false && changes.drawerOpen.previousValue === true) {
      this.warnDelete = false;
      this.error = {};
      this.store.dispatch(new ClearErrors());
    }
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
      if (error != null) {
        if (error.type && error.type.includes("mapping-delete/last-map")) {
          self.translate.get('ERROR.DELETE_MAPPING').subscribe((res: string) => self.createOrAppendError(res));
        }
        else {
          self.translate.get('ERROR.ADD_MAPPING').subscribe((res: string) => self.createOrAppendError(res));
        }
        self.error.detail = error;
      }
    });
    self.store.select(selectSourceList).subscribe(
      data => this.sources = data,
      error => this.translate.get('ERROR.LOAD_SOURCES').subscribe((res) => self.createOrAppendError(res))
    );
    self.store.select(selectReleaseList).subscribe(
      data => {
        this.editionToVersionsMap = data;
        this.editionToVersionsMapLoaded = true;
      },
      error => this.translate.get('ERROR.LOAD_VERSIONS').subscribe((res) => self.createOrAppendError(res))
    );
    self.store.select(selectFhirError).subscribe((error) => {
      if (error != null) {
        self.translate.get('ERROR.BACKEND_ISSUES' ,{url: error.url}).subscribe((res: string) => self.createOrAppendError(res));
        self.error.detail = error;
      }
    });
    self.store.select(selectAddEditMappingSuccess).subscribe(res => {
      if (res && !self.error.detail) {
        //this.closed.emit();
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
    this.warnDelete = false;
    this.closed.emit();
    this.error = {};
  }


  addSource($event: MouseEvent): void {
    $event.preventDefault();
    this.store.dispatch(new InitSelectedSource());
    let data = new Source();

    // pre-fill values SNOMED-453
    if (this.previousVersionSource) {
      data.name = this.previousVersionSource.name;
      data.version = FormUtils.calculateNextVersion(this.previousVersionSource.version);
    }

    const dialogRef = this.dialog.open(SourceImportComponent, {
      width: this.width, data
    });

    dialogRef.afterClosed().subscribe(
      (result: boolean) => {
        if (result) {
          // don't do this if the user selected cancel, it clears the existing source out
          this.store.select(selectSourceState).subscribe((state) => {
            this.sources = state.sources;
            this.mappingModel.source = state.selectedSource ?? new Source();
          });
        }
      });
  }

  loadReleases(): void {
    this.store.dispatch(new LoadReleases());
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

  changeEdition($event: MatSelectChange) {
    this.mappingModel.toVersion = ""; // reset
    let versions = this.editionToVersionsMap?.get($event.value);
    if (versions) {
      this.editionVersions = versions;
      // select the most recent (or only, if just 1) version
      this.mappingModel.toVersion = this.editionVersions[0].uri;
    }
  }

  deleteMap(): void {
    if (!this.warnDelete) {
      this.warnDelete = true;
    }
    else {
      this.warnDelete = false;
      this.store.dispatch(new DeleteMapping(this.mappingModel));
    }
  }

  private createOrAppendError(err: string): void {
    const self = this;
    self.elRef.nativeElement.parentElement.scrollTop = 0;
    if (!self.error.messages) {
      self.error.messages = [];
    }
    if (!self.error.messages.includes(err)) {
      self.error.messages.push(err);
    }
  }

  private hasAvailableTargetVersion(toVersion: string | null): boolean {
    if (toVersion && this.editionToVersionsMap && this.editionToVersionsMap.size > 0) {
      // returns array of uris
      for (let [key, value] of this.editionToVersionsMap) {
        var result = value.filter(obj => {
          return obj.uri === toVersion
        })
        if (result.length > 0) {
          return true;
        }
      }
    }
    return false;
  }
}
