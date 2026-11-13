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

import {Component, Input, OnInit} from '@angular/core';
import {Project} from '../_models/project';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-project-badges',
    templateUrl: './project-badges.component.html',
    styleUrls: ['./project-badges.component.css'],
    standalone: false
})
export class ProjectBadgesComponent implements OnInit {
  @Input() project: Project = new Project();
  constructor(
    public translate: TranslateService) { }

  ngOnInit(): void {
  }

}
