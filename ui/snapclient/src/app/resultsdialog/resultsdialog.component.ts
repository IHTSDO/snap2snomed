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

import { Component, Inject, OnInit } from '@angular/core';
import {MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-resultsdialog',
    templateUrl: './resultsdialog.component.html',
    styleUrls: ['./resultsdialog.component.css'],
    standalone: false
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
