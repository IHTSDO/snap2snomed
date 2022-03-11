export class Source {
  id: string | null;
  name: string;
  version: string;
  description: string | null;
  hasHeader: boolean | null;
  contentType: string;
  codeColumnIndex: number | null;
  displayColumnIndex: number | null;
  source_file?: File | null;
  delimiter?: string | null;

  constructor() {
    this.id = '';
    this.name = '';
    this.version = '';
    this.description = null;
    this.hasHeader = null;
    this.contentType = 'text/plain';
    this.codeColumnIndex = null;
    this.displayColumnIndex = null;
    this.source_file = null;
    this.delimiter = null;
  }
}
