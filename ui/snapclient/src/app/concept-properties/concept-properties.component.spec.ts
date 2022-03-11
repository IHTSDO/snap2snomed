import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../app.config';
import { HttpLoaderFactory } from '../app.module';
import { initialAppState } from '../store/app.state';

import { ConceptPropertiesComponent } from './concept-properties.component';

describe('ConceptPropertiesComponent', () => {
  let component: ConceptPropertiesComponent;
  let fixture: ComponentFixture<ConceptPropertiesComponent>;

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
      providers: [TranslateService, { provide: APP_CONFIG, useValue: {} },
      provideMockStore({ initialState: initialAppState })],
      declarations: [ConceptPropertiesComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
