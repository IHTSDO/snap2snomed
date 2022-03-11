import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {ErrorInfo} from '../errormessage/errormessage.component';
import { IAppState } from '../store/app.state';
import { LookupConcept } from '../store/fhir-feature/fhir.actions';
import { Properties } from '../store/fhir-feature/fhir.effects';
import { selectConceptProperties } from '../store/fhir-feature/fhir.selectors';
import { SelectionService } from '../_services/selection.service';

@Component({
  selector: 'app-concept-properties',
  templateUrl: './concept-properties.component.html',
  styleUrls: ['./concept-properties.component.css']
})
export class ConceptPropertiesComponent implements OnInit, OnDestroy {
  @Input() active = true;
  @Input() version = '';

  code = '';
  display = '';
  system = 'http://snomed.info/sct';

  properties: Properties = {};
  propertiesView: {
    key: string,
    value: any,
  }[] = [];
  error: ErrorInfo = {};

  displayedColumns = [
    'key',
    'aux',
    'value',
  ];

  private displayedProps = [
    'code',
    'Fully specified name',
    'display',
    'inactive',
    // 'Preferred For Language',
    'Synonym',
    // 'system',  // Kylynn says no
    // 'version', // Kylynn says no
    'effectiveTime',
    'moduleId',
  ];
  private subscription = new Subscription();

  constructor(
    public translate: TranslateService,
    private selectionService: SelectionService,
    private store: Store<IAppState>) {
  }

  ngOnInit(): void {
    const self = this;

    self.subscription.add(this.selectionService.subscribe({
      next(selection: any): void {
        if (self.active && selection?.code) {
          self.code = selection.code;
          self.display = selection.display;
          self.system = selection.system;

          self.store.dispatch(new LookupConcept({
            code: selection.code,
            system: selection.system,
            version: selection.version ?? self.version,
          }));
        }
      },
      error(error): void { console.error('Selection error', error); },
      complete(): void {}
    }));

    self.subscription.add(self.store.select(selectConceptProperties).subscribe(
      (props) => {
        self.propertiesView = [];
        if (props) {
          this.displayedProps.forEach(p => {
            props[p]?.forEach(v => {
              if (p === 'Fully specified name') {
                self.display = v[0];
              }
              this.propertiesView.push({ key: p, value: v });
            });
          });
        }
      },
      (_error) => this.translate.get('ERROR.CONCEPT_LOOKUP').subscribe((res) => this.error.message = res)
    ));

    self.propertiesView = [];

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
