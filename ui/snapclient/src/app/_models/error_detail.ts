
export class ErrorDetail {
  type: string;
  title: string;
  detail: string;
  status: number;
  violations?: {
    field: string;
    message: string;
  }[];

  constructor() {
    this.type = 'http://snap2snomed.app/problem/ui/uninitialised-error';
    this.title = 'The Error object has not been initialised';
    this.detail = 'If you see this, please report a bug';
    this.status = 500;
  }
}
