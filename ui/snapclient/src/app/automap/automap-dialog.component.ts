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
