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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {Match} from 'src/app/store/fhir-feature/fhir.reducer';
import {SelectionService} from 'src/app/_services/selection.service';

@Component({
    selector: 'app-concept-list',
    templateUrl: './concept-list.component.html',
    styleUrls: ['./concept-list.component.css'],
    standalone: false
})
export class ConceptListComponent implements OnInit, OnDestroy {

  @Input() items: Match[] = [];

  private subscription = new Subscription();
  displayedColumns = [
    'label',
    'tag',
  ];

  selected?: number;

  constructor(
    private selectionService: SelectionService,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.selectionService.subscribe({
        next: (_value: any) => {
          this.selected = undefined;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  click(value: number): void {
    if (this.selected === value) {
      this.selectionService.select(null);
      this.selected = undefined;
    } else {
      const concept = this.items[value];
      this.selectionService.select(concept);
      this.selected = value;
    }
  }

}
