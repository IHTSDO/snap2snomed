import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpLoaderFactory } from '../app.module';

import { TargetVersionComponent } from './target-version.component';

describe('TargetVersionComponent', () => {
  let component: TargetVersionComponent;
  let fixture: ComponentFixture<TargetVersionComponent>;

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
      providers: [ TranslateService ],
      declarations: [ TargetVersionComponent ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
