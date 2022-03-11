import {Component, Input, OnInit} from '@angular/core';
import {SourceCode} from '../../_models/source_code';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-source-detail',
  templateUrl: './source-detail.component.html',
  styleUrls: ['./source-detail.component.css']
})
export class SourceDetailComponent implements OnInit {

  @Input() source: SourceCode | null = null;

  constructor(public translate: TranslateService) {
  }

  ngOnInit(): void {
  }

}
