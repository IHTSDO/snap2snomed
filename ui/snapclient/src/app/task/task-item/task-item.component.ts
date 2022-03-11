import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {Task} from 'src/app/_models/task';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent implements OnInit {
  @Input() task: Task | undefined;
  @Input() showRows = false;

  constructor() { }

  ngOnInit(): void {
  }

}
