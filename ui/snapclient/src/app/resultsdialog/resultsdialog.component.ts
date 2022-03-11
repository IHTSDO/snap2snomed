import { Component, Inject, OnInit } from '@angular/core';
import {MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-resultsdialog',
  templateUrl: './resultsdialog.component.html',
  styleUrls: ['./resultsdialog.component.css']
})
export class ResultsdialogComponent implements OnInit {

  message: string;
  error: boolean;
  infoIcon: boolean;

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<ResultsdialogComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any
    ) {
    this.message = 'Result Dialog';
    this.error = false;
    this.infoIcon = false;
   }

  ngOnInit(): void {
    this.message = this.data.message;
    this.error = this.data.error;
    this.infoIcon = this.data.infoIcon;
  }

}
