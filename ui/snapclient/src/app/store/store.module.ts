import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EffectsModule} from '@ngrx/effects';
import {AuthEffects} from './auth-feature/auth.effects';
import {MappingEffects} from './mapping-feature/mapping.effects';
import {SourceEffects} from './source-feature/source.effects';
import {FhirEffects} from './fhir-feature/fhir.effects';
import {MetaReducer} from '@ngrx/store';
import {flushStateReducer, localStorageSyncReducer} from './app.reducers';

export const metaReducers: Array<MetaReducer<any, any>> = [localStorageSyncReducer, flushStateReducer];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([AuthEffects, MappingEffects, SourceEffects, FhirEffects])
  ]
})
export class StoreModule {
}
