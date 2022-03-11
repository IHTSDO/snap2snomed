
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
