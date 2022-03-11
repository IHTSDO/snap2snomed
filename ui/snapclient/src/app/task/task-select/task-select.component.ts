import {Component, Input, OnInit} from '@angular/core';
import {Task} from '../../_models/task';
import {MatSelectChange} from '@angular/material/select';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-task-select',
  templateUrl: './task-select.component.html',
  styleUrls: ['./task-select.component.css']
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
