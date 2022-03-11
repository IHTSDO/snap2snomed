import {Component, Input, OnInit} from '@angular/core';
import {Note} from '../../_models/note';

@Component({
  selector: 'app-notes-item',
  templateUrl: './notes-item.component.html',
  styleUrls: ['./notes-item.component.css']
})
export class NotesItemComponent implements OnInit {
  @Input() note: Note | null = null;
  constructor() { }

  ngOnInit(): void {
  }

}
