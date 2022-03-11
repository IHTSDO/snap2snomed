import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpLoaderFactory} from 'src/app/app.module';
import {Mapping} from 'src/app/_models/mapping';
import {Project} from 'src/app/_models/project';
import {LastupdatedPipe} from 'src/app/_utils/lastupdated_pipe';

import { MappingDetailsCardComponent } from './mapping-details-card.component';

describe('MappingDetailsCardComponent', () => {
  let component: MappingDetailsCardComponent;
  let fixture: ComponentFixture<MappingDetailsCardComponent>;

  const mapping = new Mapping();
  mapping.project.maps.push(mapping);

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
      declarations: [
        MappingDetailsCardComponent,
        LastupdatedPipe
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    const project = mapping.project;
    project.id = '1';
    project.title = 'Test Map';

    mapping.id = '2';
    mapping.mapVersion = 'V1.0';

    fixture = TestBed.createComponent(MappingDetailsCardComponent);
    component = fixture.componentInstance;
    component.mapping = mapping;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Map title', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('h2'));
    expect(el.nativeElement.textContent).toBe('Test Map');
    expect(el).toBeTruthy();
  });

});
