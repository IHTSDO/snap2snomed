/**
 * Main Map class (note naming as Mapping is to avoid conflicts with native JS function, map)
 */

import {Project} from './project';
import {Source} from './source';

export class Mapping {

  constructor() {
    this.id = '';
    this.project = new Project();
    this.mapVersion = '';
    this.source = new Source();
    this.toVersion = null;
    this.toScope = '*'; // ECL for "all SNOMED concepts" - cannot use 'ANY' because SnowStorm
    this.created = new Date();
    this.modified = new Date();
  }

  id: string | null;
  project: Project;
  mapVersion: string;
  source: Source;
  toSystem = 'http://snomed.info/sct';  // Always "to snomed" for the moment
  toVersion: string | null;
  toScope: string;
  created: Date;
  modified: Date;

  static replacer(key: string, value: any): any {
    if (value !== null && key === 'project') {
      return '/projects/' + value.id;
    } else if (value !== null && key === 'source') {
      return '/importedCodeSets/' + value.id;
    }
    return value;
  }

  static getStatus(mapping: Mapping): string {
    // TODO - Calculate rows mapped
    return 'MAP.STATUS_NOT_STARTED';
  }
}


