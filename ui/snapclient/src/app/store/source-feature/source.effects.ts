import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {of} from 'rxjs/internal/observable/of';
import {SourceService} from '../../_services/source.service';
import {
  LoadSourcesSuccess,
  LoadSourcesFailure,
  ImportSourceFailure,
  ImportSourceSuccess,
  SourceActions,
  SourceActionTypes,
  ImportMappingFileSuccess,
  ImportMappingFileFailure
} from './source.actions';
import {Source} from '../../_models/source';
import {ServiceUtils} from 'src/app/_utils/service_utils';


@Injectable()
export class SourceEffects {

  loadSources$ = createEffect(() => this.actions$.pipe(
    ofType(SourceActionTypes.LOAD_SOURCES),
    switchMap((action) => this.sourceService.fetchSources().pipe(
      map((resp) => resp._embedded.importedCodeSets as Source[]),
      map((sources: Source[]) => sources.map((source: any) => {
        source.id = ServiceUtils.extractIdFromHref(source._links?.self.href, null);
        return source as Source;
      })),
      switchMap((sources: Source[]) => of(new LoadSourcesSuccess(sources))),
      catchError((err) => of(new LoadSourcesFailure({ error: err })))
    ))), { dispatch: true });


  importSource$ = createEffect(() => this.actions$.pipe(
    ofType(SourceActionTypes.IMPORT_SOURCE),
    switchMap((action) => this.sourceService.importSource(action.payload.source, action.payload.sourceType).pipe(
      switchMap((source) => of(new ImportSourceSuccess(source))),
      catchError((err) => of(new ImportSourceFailure({error: err})))
    ))), {dispatch: true});

  importMappingFile$ = createEffect(() => this.actions$.pipe(
      ofType(SourceActionTypes.IMPORT_MAPPING_FILE),
      switchMap((action) => this.sourceService.importMap(action.payload.source, action.payload.sourceType).pipe(
        switchMap((source) => of(new ImportMappingFileSuccess(source))),
        catchError((err) => of(new ImportMappingFileFailure({error: err})))
      ))), {dispatch: true});

  constructor(
    private actions$: Actions<SourceActions>,
    private sourceService: SourceService,
  ) {
  }

}
