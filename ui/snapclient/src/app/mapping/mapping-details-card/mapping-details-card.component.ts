import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Mapping} from 'src/app/_models/mapping';

@Component({
  selector: 'app-mapping-details-card',
  templateUrl: './mapping-details-card.component.html',
  styleUrls: ['./mapping-details-card.component.css']
})
export class MappingDetailsCardComponent {

  @Input() mapping!: Mapping;
  @Input() editable: boolean = false;

  @Output() clicked = new EventEmitter();

  constructor(private translate: TranslateService) { }

  clickHandler(): void {
    this.clicked.emit();
  }

  hasHandler(): boolean {
    return this.clicked.observers.length > 0;
  }

}
