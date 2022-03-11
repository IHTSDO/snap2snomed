
export class ValidationResult {
  get activeCount(): number {
    return this._activeCount;
  }

  set activeCount(value: number) {
    this._activeCount = value;
  }

  get inactive(): string[] {
    return this._inactive;
  }

  set inactive(value: string[]) {
    this._inactive = value;
  }

  get absent(): string[] {
    return this._absent;
  }

  set absent(value: string[]) {
    this._absent = value;
  }

  get invalid(): string[] {
    return this._invalid;
  }

  set invalid(value: string[]) {
    this._invalid = value;
  }

  private _activeCount: number = -1;
  private _inactive: string[] = [];
  private _absent: string[] = [];
  private _invalid: string[] = [];
}
