import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { APP_CONFIG } from 'src/app/app.config';
import { initialAppState } from 'src/app/store/app.state';
import { selectSelectedRows } from 'src/app/store/mapping-feature/mapping.selectors';

import { MappingTableSelectorComponent } from './mapping-table-selector.component';

describe('MappingTableSelectorComponent', () => {
  let component: MappingTableSelectorComponent;
  let fixture: ComponentFixture<MappingTableSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MappingTableSelectorComponent ],
      providers: [
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectSelectedRows, value: ['1', '2']}
          ],
        })],

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MappingTableSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
