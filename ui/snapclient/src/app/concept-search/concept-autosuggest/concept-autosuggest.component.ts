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

import {R4} from '@ahryman40k/ts-fhir-types';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {IAppState} from 'src/app/store/app.state';
import {AutoSuggest} from 'src/app/store/fhir-feature/fhir.actions';
import {Match} from 'src/app/store/fhir-feature/fhir.reducer';
import {selectSuggestions} from 'src/app/store/fhir-feature/fhir.selectors';
import {SEQUENCE as DEFAULT_SEQUENCE} from 'src/app/_services/fhir.service';

@Component({
    selector: 'app-concept-autosuggest',
    templateUrl: './concept-autosuggest.component.html',
    styleUrls: ['./concept-autosuggest.component.css'],
    standalone: false
})
export class ConceptAutosuggestComponent implements OnInit, OnDestroy {

  @Input() version = 'http://snomed.info/sct';
  @Input() scope = '*';
  @Input() strategy: string = DEFAULT_SEQUENCE;

  @Input() set search(value: string) {
    this._search = value;
    this.suggest();
  }

  @Input() set activeOnly(value: boolean) {
    this._activeOnly = value;
    this.suggest();
  }

  private _search: string | undefined;
  // tslint:disable-next-line:variable-name
  private _activeOnly = true;
  private subscription = new Subscription();

  size = 10;
  error: ErrorInfo = {};

  matches: Match[] = [];

  constructor(
    public translate: TranslateService,
    private store: Store<IAppState>,
  ) {
  }

  ngOnInit(): void {
    const self = this;
    self.matches = [];
    self.subscription.add(self.store.select(selectSuggestions).subscribe(
      (matches) => {
        self.matches = matches ?? [];
      },
      error => this.translate.get('ERROR.AUTO_SUGGEST').subscribe((res) => this.error.message = res)
    ));

    // self.suggest();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private suggest(): void {
    if (this._search) {
      this.store.dispatch(new AutoSuggest({
        text: this._search,
        version: this.version,
        scope: this.scope,
        strategy: this.strategy,
        activeOnly: this._activeOnly
      }));
    } else {
      this.matches = [];
    }
  }

  private toMatch(param: R4.IParameters_Parameter): Match | null {
    const coding = param.part?.find(p => 'concept' === p.name)?.valueCoding;
    if (coding) {
      const semanticTag = coding?.extension?.find(ex => 'http://snomed.info/field/semanticTag' === ex.url)?.valueString;
      return {
        inactive: false,
        ...coding,
        label: coding.display,
        tag: semanticTag,
      };
    } else {
      return null;
    }
  }

}
