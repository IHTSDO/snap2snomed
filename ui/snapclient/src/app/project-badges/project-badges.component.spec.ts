import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ProjectBadgesComponent} from './project-badges.component';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {HttpLoaderFactory} from "../app.module";
import {APP_CONFIG} from "../app.config";
import {provideMockStore} from "@ngrx/store/testing";
import {initialAppState} from "../store/app.state";

describe('ProjectBadgesComponent', () => {
  let component: ProjectBadgesComponent;
  let fixture: ComponentFixture<ProjectBadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [TranslateService, {provide: APP_CONFIG, useValue: {}},
        provideMockStore({initialState: initialAppState})],
      declarations: [ProjectBadgesComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
