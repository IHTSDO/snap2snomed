import {Component, Input, OnInit} from '@angular/core';
import {Project} from '../_models/project';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-project-badges',
  templateUrl: './project-badges.component.html',
  styleUrls: ['./project-badges.component.css']
})
export class ProjectBadgesComponent implements OnInit {
  @Input() project: Project = new Project();
  constructor(
    public translate: TranslateService) { }

  ngOnInit(): void {
  }

}
