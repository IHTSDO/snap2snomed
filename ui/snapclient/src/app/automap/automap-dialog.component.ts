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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from '../dialog/confirm-dialog/confirm-dialog.component';
import {ProgressAnimationEnd} from '@angular/material/progress-bar';

export interface ProgressDialogData extends DialogData {
  automapPercent: any;
  error: string | null;
}

@Component({
    selector: 'app-automap-dialog',
    templateUrl: './automap-dialog.component.html',
    styleUrls: ['./automap-dialog.component.css'],
    standalone: false
})
export class AutomapDialogComponent {
  processing: boolean;

  constructor(public dialogRef: MatDialogRef<AutomapDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ProgressDialogData) {
    this.processing = true;
  }

  complete($event: ProgressAnimationEnd): void {
    if ($event.value === 100) {
      this.processing = false;
    }
  }

  rounded(automapPercent: any): number {
    if (automapPercent && typeof automapPercent === 'number') {
      return Math.round(automapPercent);
    } else {
      return 0;
    }
  }
}
