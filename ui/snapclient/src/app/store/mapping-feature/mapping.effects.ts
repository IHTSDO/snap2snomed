/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, concatMap, debounceTime, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {
  AddMappingFailure,
  AddMappingSuccess,
  CopyMappingFailure,
  CopyMappingSuccess,
  LoadMappingFailure,
  LoadMappingSuccess,
  LoadMapViewFailure,
  LoadMapViewSuccess,
  LoadProjectsFailure,
  LoadProjectsSuccess,
  MappingActions,
  MappingActionTypes,
  UpdateMappingFailure,
  UpdateMappingSuccess
} from './mapping.actions';
import {Router} from '@angular/router';
import {of} from 'rxjs/internal/observable/of';
import {MapService, MapViewResults} from '../../_services/map.service';
import {Mapping} from '../../_models/mapping';
import {ServiceUtils} from '../../_utils/service_utils';
import {forkJoin, Observable, throwError} from 'rxjs';
import {Project} from '../../_models/project';
import {User} from '../../_models/user';
import {Source} from '../../_models/source';
import {UserService} from 'src/app/_services/user.service';
import {SourceService} from 'src/app/_services/source.service';
import {ImportMappingFileFailure, ImportMappingFileResult, ImportMappingFileSuccess} from '../source-feature/source.actions';
import {cloneDeep} from 'lodash';


@Injectable()
export class MappingEffects {

  addMapping$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.ADD_MAPPING),
    map(action => action.payload),
    switchMap((new_mapping) => {
      if (!new_mapping.mapping.source.id) {
        return of(new AddMappingFailure({error: 'MAP.SOURCE_REQUIRED'}));
      }
      const sid = of(new_mapping.mapping.source.id);
      let pid: Observable<string>;
      if (new_mapping.mapping.project.id) {
        pid = of(new_mapping.mapping.project.id);
      } else {
        pid = this.mapService.createProject(new_mapping.mapping.project).pipe(
          map(p => ServiceUtils.extractIdFromHref(p._links.self.href, null)));
      }

      return forkJoin([pid, sid]).pipe(
        switchMap(([projectid, sourceid]) => {
          return this.mapService.createMapping(new_mapping.mapping, projectid, sourceid).pipe(
            map((m) => {
              new_mapping.mapping.id = ServiceUtils.extractIdFromHref(m._links.self.href, null);
              new_mapping.mapping.source = m.source as Source;
              if (new_mapping.mapping.project) {
                new_mapping.mapping.project.mapcount = 1;
              }
              return new_mapping.mapping;
            }),
            switchMap((mapping: Mapping) => of(new AddMappingSuccess(mapping))),
            catchError((err: any) => of(new AddMappingFailure(err))),
          ).pipe(
            map((result) => result.payload),
            switchMap((createResult) => {
              if (new_mapping.importFile && createResult instanceof Mapping) {
                new_mapping.importFile.source.mapId = createResult.id;
              }
              return this.sourceService.importMap(
                new_mapping.importFile?.source, new_mapping.importFile?.sourceType).pipe(
                map((m) => {
                  return m;
                }),
                switchMap((result: ImportMappingFileResult) => [
                  new ImportMappingFileSuccess(result),
                  new AddMappingSuccess(new_mapping.mapping)
                ]),
                catchError((err, mapping) => [
                  new ImportMappingFileFailure(err),
                  new AddMappingSuccess(new_mapping.mapping)
                ])
              );
            })
          );
        })
      );
    }),
    catchError((err: any) => of(new AddMappingFailure(err)))
  ), {dispatch: true});

  addMappingSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.ADD_MAPPING_SUCCESS),
    map((action) => action.payload.id),
    tap((id) => {
      this.router.navigate(['map-view', id], {replaceUrl: true});
    })
  ), {dispatch: false});


  copyMapping$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.COPY_MAPPING),
    map(action => action.payload),
    switchMap((payload) => this.mapService.copyMapping(payload).pipe(
      switchMap((mapping_id: number) => this.mapService.getMapForId(mapping_id.toString()).pipe(
          map((mapDto: any) => toMapping(mapDto)),
          switchMap((mapping: Mapping) => of(new CopyMappingSuccess(mapping))),
      catchError((err: any) => of(new CopyMappingFailure(err)))
    )))),
  ), {dispatch: true});

  copyMappingSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.COPY_MAPPING_SUCCESS),
    map((action) => {
      this.router.navigate(['map-view', action.payload.id], {replaceUrl: true});
    })
  ), {dispatch: false});


  updateMapping$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.UPDATE_MAPPING),
    map(action => action.payload),
    concatMap((mapping: Mapping) => {
      // id comes as a number, not a string
      mapping.id = '' + mapping.id;
      this.mapService.updateMapping(mapping).subscribe((res) => res, error => throwError({error}));
      this.mapService.updateProject(mapping.project).subscribe((res) => res, error => throwError({error}));
      this.mapService.updateProjectRoles(mapping.project).subscribe((res) => res, error => throwError({error}));
      return of(mapping);
    }),
    switchMap((mapping: Mapping) => of(new UpdateMappingSuccess(mapping))),
    catchError((err: any) => of(new UpdateMappingFailure(err)))
  ), {dispatch: true});


  updateMappingSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.UPDATE_MAPPING_SUCCESS),
    map((action) => {
      this.router.navigate(['map-view', action.payload.id], {replaceUrl: true});
    })
  ), {dispatch: false});


  loadProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MappingActionTypes.LOAD_PROJECTS),
      map((action) => action.payload),
      switchMap((payload) => this.mapService.fetchProjects(payload.pageSize, payload.currentPage).pipe(
        map((resp) => {
          const projects = resp._embedded.projects.map(toProject);
          return [resp.page, projects.map((proj: Project) => {
            let theProj = new Project();
            theProj = cloneDeep(proj);
            this.userService.getUsersForProject(proj).subscribe(
              (res) => {
                theProj.owners = [...res.owners];
                theProj.members = [...res.members];
                theProj.guests = [...res.guests];
              });
            return theProj;
          })];
        }),
        mergeMap(([page, projects]) => of(new LoadProjectsSuccess({items: projects, page}))),
        catchError((err: any) => of(new LoadProjectsFailure(err)))
      )));
  }, {dispatch: true});

  loadMapping$ = createEffect(() => this.actions$.pipe(
    ofType(MappingActionTypes.LOAD_MAPPING),
    map((action) => action.payload),
    switchMap((payload) => this.mapService.getMapForId(payload.id).pipe(
      map((mapDto: any) => {
        return toMapping(mapDto);
      }),
      switchMap((mapping: Mapping) => of(new LoadMappingSuccess(mapping))),
      catchError((err: any) => of(new LoadMappingFailure(err))),
    )),
  ), {dispatch: true});

  loadMapView$ = createEffect(() => this.actions$.pipe(
    debounceTime(100),
    ofType(MappingActionTypes.LOAD_MAP_VIEW),
    map((action) => action.payload),
    switchMap((payload) => {
      const context = payload.context;
      return this.mapService.getMapView(payload.mapping, context.pageIndex,
        context.pageSize, context.sortColumn, context.sortDir, context.filter).pipe(
        switchMap((mapView: MapViewResults) => of(new LoadMapViewSuccess(mapView))),
        catchError((error: any) => of(new LoadMapViewFailure({error}))),
      );
    }),
  ), {dispatch: true});

  loadTaskView$ = createEffect(() => this.actions$.pipe(
    debounceTime(100),
    ofType(MappingActionTypes.LOAD_TASK_VIEW),
    map((action) => action.payload),
    switchMap((payload) => {
      const context = payload.context;
      return this.mapService.getTaskView(payload.task, context.pageIndex,
        context.pageSize, context.sortColumn, context.sortDir, context.filter).pipe(
        switchMap((mapView: MapViewResults) => of(new LoadMapViewSuccess(mapView))),
        catchError((error: any) => of(new LoadMapViewFailure({error}))),
      );
    }),
  ), {dispatch: true});

  constructor(
    private actions$: Actions<MappingActions>,
    private mapService: MapService,
    private sourceService: SourceService,
    private userService: UserService,
    private router: Router) {
  }

}

function toMapping(mapDto: any, project?: Project): Mapping {
  const mapping = new Mapping();

  mapping.id = '' + mapDto.id;
  mapping.source = mapDto.source as Source;
  mapping.created = new Date(mapDto.created);
  mapping.modified = new Date(mapDto.modified);
  mapping.mapVersion = mapDto.mapVersion;
  mapping.toVersion = mapDto.toVersion;
  mapping.toScope = mapDto.toScope;

  if (project) {
    mapping.project = project;
  } else {
    mapping.project = toProject(mapDto.project);
    mapping.project.owners = mapDto.owners.map(toUser);
    mapping.project.members = mapDto.members?.map(toUser) ?? [];
    mapping.project.guests = mapDto.guests?.map(toUser) ?? [];
  }

  return mapping;
}

function mapUsers(res: any): User[] {
  return res._embedded.users.map((u: any) => {
    const user = new User();
    user.id = ServiceUtils.extractIdFromHref(u._links.self.href, null);
    user.givenName = u.givenName;
    user.familyName = u.familyName;
    user.email = u.email;
    return user;
  });
}

function toProject(project: any): Project {
  const proj = new Project();
  proj.title = project.title;
  proj.description = project.description;
  proj.id = project.id;
  proj.maps = (project.maps ?? []).map((m: any) => toMapping(m, project));
  proj.mapcount = project.mapCount;
  proj.created = new Date(project.created);
  proj.modified = new Date(project.modified);
  return proj;
}

function toUser(u: any): User {
  const user = new User();
  user.id = u.id;
  user.givenName = u.givenName;
  user.familyName = u.familyName;
  user.email = u.email;
  return user;
}
