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

import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Mapping} from 'src/app/_models/mapping';
import { TARGET_OUT_OF_SCOPE_TAG } from 'src/app/_models/map_row';
import { MapService } from 'src/app/_services/map.service';
import { TargetChangedService } from 'src/app/_services/target-changed.service';

@Component({
  selector: 'app-mapping-details-card',
  templateUrl: './mapping-details-card.component.html',
  styleUrls: ['./mapping-details-card.component.css']
})
export class MappingDetailsCardComponent {

  @Input() mapping!: Mapping;
  @Input() editable: boolean = false;

  @Output() clicked = new EventEmitter();

  outOfScopeTargetCount: number | string = "";

  constructor(private translate: TranslateService,
              private router: Router,
              private mapService: MapService,
              private targetChangedService: TargetChangedService) {
  }

  ngOnInit() {

    this.targetChangedService.targetChanged$.subscribe(row => {
      this.updateNumOutOfScopeTargets();
    })

    this.updateNumOutOfScopeTargets();

  }

  updateNumOutOfScopeTargets() {
    if (this.mapping.id) {
      this.mapService.getTagCount(this.mapping.id, TARGET_OUT_OF_SCOPE_TAG).subscribe((result) => {
        this.outOfScopeTargetCount = result.page.totalElements;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mapping?.currentValue && !changes.mapping?.isFirstChange()) {
      this.mapping = changes.mapping.currentValue;
      this.updateNumOutOfScopeTargets();
    }
  }

  versionSelectionChange($event: MatSelectChange): void {
    // if access is restricted in the future at the mapping version
    // level rather than at the project level (current situation),
    // we would have to test access here before proceeding.
    // Currently entry to the project has this
    // test if (this.currentUser && this.hasProjectRole(project))
    this.router.navigate(['map-view', $event.value], {replaceUrl: false});
  }

  clickHandler(): void {
    this.clicked.emit();
  }

  hasHandler(): boolean {
    return this.clicked.observers.length > 0;
  }

}
