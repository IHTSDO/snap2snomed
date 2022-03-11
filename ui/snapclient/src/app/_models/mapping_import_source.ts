export class MappingImportSource {
  hasHeader: boolean | null;
  contentType: string;
  codeColumnIndex: number | null;
  displayColumnIndex: number | null;
  targetCodeColumnIndex: number | null;
  targetDisplayColumnIndex: number | null;
  relationshipColumnIndex: number | null;
  source_file?: File | null;
  delimiter?: string | null;
  mapId: string | null;

  constructor() {
    this.hasHeader = null;
    this.contentType = 'text/plain';
    this.codeColumnIndex = null;
    this.displayColumnIndex = null;
    this.targetCodeColumnIndex = null;
    this.targetDisplayColumnIndex = null;
    this.relationshipColumnIndex = null;
    this.source_file = null;
    this.delimiter = null;
    this.mapId = null;
  }
}
