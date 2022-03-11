import { Component, OnInit } from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import {ProgressSpinnerMode} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {
  color: ThemePalette;
  diameter: number;
  mode: ProgressSpinnerMode ;
  value: number;

  constructor() {
    this.color = 'primary';
    this.diameter = 100;
    this.mode = 'indeterminate';
    this.value = 50;
  }

}
