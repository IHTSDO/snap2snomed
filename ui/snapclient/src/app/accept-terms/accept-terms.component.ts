import {Component} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-accept-terms',
  templateUrl: './accept-terms.component.html',
  styleUrls: ['./accept-terms.component.css']
})
export class AcceptTermsComponent {

  constructor(public dialogRef: MatDialogRef<AcceptTermsComponent>) {}

  onReject(): void {
    this.dialogRef.close(false);
  }

  onAccept(): void {
    this.dialogRef.close(true);
  }
}
