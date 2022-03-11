import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export interface DialogData {
  title: string;
  message: string;
  button: string;
  cancel?: string;
  type: string;
  subtitle?: string;
}

export enum DialogType {
  SAVE = 'SAVE',
  CONFIRM = 'CONFIRM'
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {

  isFixedSize: boolean | null | undefined;

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

}
