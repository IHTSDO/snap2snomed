
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
