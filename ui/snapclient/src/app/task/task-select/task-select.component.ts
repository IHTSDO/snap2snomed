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
import {Task} from '../../_models/task';
import {MatSelectChange} from '@angular/material/select';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {Router} from '@angular/router';

@Component({
    selector: 'app-task-select',
    templateUrl: './task-select.component.html',
    styleUrls: ['./task-select.component.css'],
    standalone: false
})
export class TaskSelectComponent implements OnInit {
  @Input() selectedTask: Task | null = null;
  @Input() selectedLabel = '';
  @Input() myTasks: Task[] = [];
  @Input() showRows = false;
  error: ErrorInfo = {};

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  changeTask($event: MatSelectChange): void {
    const self = this;
    if (self.selectedTask) {
      this.router.navigate(['map-view', self.selectedTask.mapping.id, 'map-work', self.selectedTask.id], {replaceUrl: false});
    }
  }

}
