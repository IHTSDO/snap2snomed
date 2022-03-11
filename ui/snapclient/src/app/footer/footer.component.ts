import {Component, Inject, OnInit} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../app.config';
import {FeedbackWidgetComponent} from "../feedback-widget/feedback-widget.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  si: string;
  tos: string;
  privacy: string;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, public dialog: MatDialog) {
    this.si = 'http://www.snomed.org';
    this.tos = config.termsOfServiceUrl;
    this.privacy = config.privacyPolicyUrl;
  }

  ngOnInit(): void {
  }

  showFeedback() : boolean{
    this.dialog.open(FeedbackWidgetComponent, {
      height: '600px',
      width: '600px',
      closeOnNavigation: true
    });
    return false;
  }
}

