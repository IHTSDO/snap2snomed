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
