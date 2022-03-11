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

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './auth.guard';
import {MappingViewComponent} from './mapping/mapping-view/mapping-view.component';
import {MappingListComponent} from './mapping/mapping-list/mapping-list.component';
import {MappingWorkComponent} from './mapping/mapping-work/mapping-work.component';
import {NotauthorizedComponent} from './notauthorized/notauthorized.component';
import {LogoutComponent} from './logout/logout.component';


const routes: Routes = [
  {
    path: '',
    component: MappingListComponent,
    pathMatch: 'full',
    data: {
      breadcrumb: 'HOME',
      permissions: 'ALL'
    },
  },
  {
    path: 'maps', component: MappingListComponent,
    data: {
      breadcrumb: 'MAPS',
      permissions: 'ALL'
    },
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always'
  },
  // {
  //   path: 'map-add/:id', component: MappingAddComponent,
  //   data: {
  //     breadcrumb: 'MAP_ADD'
  //   },
  //   canActivate: [AuthGuard]
  // },
  {
    path: 'map-view/:mappingid',
    children: [
      {
        path: '', component: MappingViewComponent,
        data: {
          breadcrumb: 'MAP_VIEW',
          permissions: 'AUTHORIZED'
        },
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always'
      },
      {
        path: 'map-work/:taskid',
        children: [
          {
            path: '', component: MappingWorkComponent,
            data: {
              breadcrumb: 'MAP_WORK',
            },
            canActivate: [AuthGuard],
            runGuardsAndResolvers: 'always'
          },
          // {
          //   path: 'map-details/:sourceidx', component: MappingWorkComponent,
          //   data: {
          //     breadcrumb: 'MAP_DETAIL',
          //   },
          //   canActivate: [AuthGuard]
          // },
        ]
      },
    ]
  },
  {
    path: 'notauthorized', component: NotauthorizedComponent,
    data: {breadcrumb: {skip: true}}
  },
  {
    path: 'logout', component: LogoutComponent,
    data: {breadcrumb: {skip: true}}
  },
  {path: '**', redirectTo: '/'}
];


@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
    initialNavigation: 'enabled',
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
