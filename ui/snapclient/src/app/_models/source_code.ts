import {Source} from './source';

/** Row from Source containing code to be mapped */
export class SourceCode {
  id?: string;
  code: string;
  display: string;
  source?: Source;
  index: string; // imported row index

  constructor(code: string, display: string, source: Source, index: string) {
    this.code = code;
    this.display = display;
    this.source = source;
    this.index = index;
  }
}
