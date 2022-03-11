import {R4} from '@ahryman40k/ts-fhir-types';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {ErrorInfo} from '../errormessage/errormessage.component';
import {IAppState} from '../store/app.state';
import {FindConcepts} from '../store/fhir-feature/fhir.actions';
import {Match} from '../store/fhir-feature/fhir.reducer';
import {selectConceptSearchList, selectFhirError} from '../store/fhir-feature/fhir.selectors';
import {SelectionService} from '../_services/selection.service';

@Component({
  selector: 'app-concept-search',
  templateUrl: './concept-search.component.html',
  styleUrls: ['./concept-search.component.css']
})
export class ConceptSearchComponent implements OnInit, OnDestroy {
  @Input() active: boolean = true;
  @Input() version: string;
  @Input() scope: string;
  @Input() autosuggest?: string;
  @Input() set initial(value: string) {
    this.searchControl.setValue(value);
  }

  private subscription = new Subscription();
  private debounce = 20;
  activeOnly = true;

  size = 10;
  searchControl = new FormControl('');
  error: ErrorInfo = {};
  total?: number;
  matches: Match[] = [];

  constructor(
    public translate: TranslateService,
    private selectionService: SelectionService,
    private store: Store<IAppState>) {
    this.version = 'http://snomed.info/sct';
    this.scope = '*';
  }

  ngOnInit(): void {
    const self = this;
    const resultsView = document.getElementById('searchResults');

    self.subscription.add(self.store.select(selectFhirError).subscribe(
      (error) => {
        if (error) {
          console.error(error);
          this.translate.get('ERROR.FHIR_REQUEST').subscribe((res) => this.error.message = res);
          this.error.detail = error;
        }
      }
    ));

    self.matches = [];
    self.subscription.add(self.store.select(selectConceptSearchList).subscribe(
      (expansion) => {
        if (self.active) {
          self.total = expansion?.total;
          self.matches = (expansion?.contains ?? []).map(self.toMatch);
          if (resultsView) {
            resultsView.scrollTop = 0;
          }
        }
      },
      error => this.translate.get('ERROR.CONCEPT_SEARCH').subscribe((res) => this.error.message = res)
    ));

    self.subscription.add(self.searchControl.valueChanges
      .pipe(debounceTime(self.debounce), distinctUntilChanged())
      .subscribe((value: string) => this.search(value))
    );

    this.search(self.searchControl.value);
  }

  private search(value: string): void {
    const self = this;
    if (self.version) {
      this.selectionService.select(null);
      if (value) {
        self.store.dispatch(new FindConcepts({
          text: value,
          version: self.version,
          scope: self.scope,
          activeOnly: self.activeOnly,
        }));
      } else {
        self.matches = [];
        self.total = 0;
      }
    } else {
      this.translate.get('ERROR.NO_SCT_VERSION').subscribe((res) => this.error.message = res);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  updateActiveOnly($event: any): void {
    this.activeOnly = !this.activeOnly;
    this.search(this.searchControl.value);
  }

  private toMatch(concept: R4.IValueSet_Contains): Match {
    const allFsns = concept.designation?.filter(d => d.use?.code === '900000000000003001');
    const enFsn = allFsns?.find(d => d.language === 'en')?.value;
    const fsn = enFsn ?? allFsns?.find(() => true)?.value ?? concept.display;
    const match = fsn?.match(/^(.*) \(([^(]*)\)$/);

    const m: Match = {
      code: concept.code,
      system: concept.system,
      version: concept.version,
      display: fsn,
      inactive: concept.inactive ?? false,
    };

    if (match) {
      m.label = match[1];
      m.tag = match[2];
    } else {
      m.label = fsn;
    }

    return m;
  }

}
