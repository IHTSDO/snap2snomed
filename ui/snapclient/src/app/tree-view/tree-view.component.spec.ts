import {HttpClientTestingModule} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from '../app.config';
import {HttpLoaderFactory} from '../app.module';
import {SelectionService} from '../_services/selection.service';

import { TreeViewComponent } from './tree-view.component';

describe('TreeViewComponent', () => {
  let component: TreeViewComponent;
  let fixture: ComponentFixture<TreeViewComponent>;

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
      providers: [TranslateService, SelectionService,
        {provide: APP_CONFIG, useValue: {}},
      ],
      declarations: [ TreeViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
