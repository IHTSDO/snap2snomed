import {Action} from '@ngrx/store';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import {Source} from '../../_models/source';

export enum SourceActionTypes {
  LOAD_SOURCES = '[Map] Load Sources',
  LOAD_SOURCES_SUCCESS = '[Map] Load Sources Succeeded',
  LOAD_SOURCES_FAILED = '[Map] Load Sources Failed',
  IMPORT_SOURCE = '[Source] Import',
  IMPORT_SOURCE_SUCCESS = '[Source] Import Succeeded',
  IMPORT_SOURCE_FAILED = '[Source] Import Failed',
  INIT_SELECTED_SOURCE = '[Source] Init Selected Source',
  IMPORT_MAPPING_FILE = '[MappingFile] Import',
  IMPORT_MAPPING_FILE_SUCCESS = '[MappingFile] Import Succeeded',
  IMPORT_MAPPING_FILE_FAILED = '[MappingFile] Import Failed',
  INIT_SELECTED_MAPPINGFILE = '[MappingFile] Init Selected Mapping file',
  SELECT_MAPPINGFILE = '[MappingFile] Mapping file selected'
}

export interface ImportMappingFileResult {
  recordCount: number;
  insertCount: number;
}


export class ImportMappingFileParams {
  source: MappingImportSource;
  sourceType: string;

  constructor() {
    this.source = new MappingImportSource();
    this.sourceType = '';
  }
}

export class LoadSources implements Action {
  readonly type = SourceActionTypes.LOAD_SOURCES;
}

export class LoadSourcesSuccess implements Action {
  readonly type = SourceActionTypes.LOAD_SOURCES_SUCCESS;

  constructor(public payload: Source[]) {
  }
}

export class LoadSourcesFailure implements Action {
  readonly type = SourceActionTypes.LOAD_SOURCES_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class ImportSource implements Action {
  readonly type = SourceActionTypes.IMPORT_SOURCE;

  constructor(public payload: {source: Source, sourceType: string}) {
  }
}

export class ImportSourceSuccess implements Action {
  readonly type = SourceActionTypes.IMPORT_SOURCE_SUCCESS;

  constructor(public payload: Source) {
  }
}

export class ImportSourceFailure implements Action {
  readonly type = SourceActionTypes.IMPORT_SOURCE_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class InitSelectedSource implements Action {
  readonly type = SourceActionTypes.INIT_SELECTED_SOURCE;

  constructor() {
  }
}

export class ImportMappingFile implements Action {
  readonly type = SourceActionTypes.IMPORT_MAPPING_FILE;

  constructor(public payload: ImportMappingFileParams) {
  }
}

export class ImportMappingFileSuccess implements Action {
  readonly type = SourceActionTypes.IMPORT_MAPPING_FILE_SUCCESS;

  constructor(public payload: ImportMappingFileResult) {
  }
}

export class ImportMappingFileFailure implements Action {
  readonly type = SourceActionTypes.IMPORT_MAPPING_FILE_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class InitSelectedMappingFile implements Action {
  readonly type = SourceActionTypes.INIT_SELECTED_MAPPINGFILE;

  constructor() {
  }
}

export class SelectMappingFile implements Action {
  readonly type = SourceActionTypes.SELECT_MAPPINGFILE;

  constructor(public payload: ImportMappingFileParams | undefined) {
  }
}

export type SourceActions = LoadSources
  | LoadSourcesSuccess
  | LoadSourcesFailure
  | ImportSource
  | ImportSourceSuccess
  | ImportSourceFailure
  | InitSelectedSource
  | ImportMappingFile
  | ImportMappingFileSuccess
  | ImportMappingFileFailure
  | InitSelectedMappingFile
  | SelectMappingFile
;
