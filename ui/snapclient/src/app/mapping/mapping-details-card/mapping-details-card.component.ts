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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import { IAppState } from 'src/app/store/app.state';
import {Mapping} from 'src/app/_models/mapping';
import { Project } from 'src/app/_models/project';
import {selectAuthorizedProjects} from '../../store/app.selectors';

@Component({
  selector: 'app-mapping-details-card',
  templateUrl: './mapping-details-card.component.html',
  styleUrls: ['./mapping-details-card.component.css']
})
export class MappingDetailsCardComponent {

  @Input() mapping!: Mapping;
  @Input() editable: boolean = false;

  @Output() clicked = new EventEmitter();

  allMapsInProject: Mapping[] | null = null;

  constructor(private translate: TranslateService,
    private router: Router,
    private store: Store<IAppState>) { 
  }

  ngOnInit(): void {

    // get all maps for project
    this.store.select(selectAuthorizedProjects).subscribe((projects) => {
      if (this.mapping?.project && this.mapping.project.id !== '') {
        // use "==" not "===" as new maps come through as string ids, but existing maps come through as numbers
        const mapProject: Project[] = projects.filter((proj) => proj.id == this.mapping.project.id); 
        this.allMapsInProject = mapProject[0] ? mapProject[0].maps: null;
      }
    }).unsubscribe();
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
