import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-feedback-widget',
  templateUrl: './feedback-widget.component.html',
  styleUrls: ['./feedback-widget.component.css']
})
export class FeedbackWidgetComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<FeedbackWidgetComponent>) { }

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }
}
