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

import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MapService} from '../../_services/map.service';
import {NavigationEnd, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {selectProjectPage, selectProjects} from '../../store/mapping-feature/mapping.selectors';
import {LoadProjects} from '../../store/mapping-feature/mapping.actions';
import {Project} from '../../_models/project';
import {TranslateService} from '@ngx-translate/core';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {User} from '../../_models/user';
import {merge, Subscription} from 'rxjs';
import {Mapping} from 'src/app/_models/mapping';
import {Source} from 'src/app/_models/source';
import {AuthService} from '../../_services/auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSelectChange} from "@angular/material/select";
import {MatSort} from '@angular/material/sort';
import {debounce} from "lodash";
import {tap} from "rxjs/operators";

@Component({
  selector: 'app-mapping-list',
  templateUrl: './mapping-list.component.html',
  styleUrls: ['./mapping-list.component.css']
})
export class MappingListComponent implements OnInit, AfterViewInit, OnDestroy {
  error: ErrorInfo = {};
  projects: Project[] = [];

  displayedColumns = ['title', 'description', 'modified', 'users', 'version', 'actions'];
  roles = {
    name: 'roles',
    options: ['all', 'owner', 'member', 'guest'],
    defaultValue: 'all'
  };

  sort: MatSort | null | undefined;
  componentLoaded = false;

  selectedMapping: { [key: string]: Mapping | null } = {};
  newMapping!: Mapping;
  mode = 'FORM.CREATE';

  opened = false;

  currentUser: User | null = null; // loaded in home.component.ts onActivate
  navigationSubscription: Subscription;
  private subscription = new Subscription();

  dataSource: MatTableDataSource<Project> = new MatTableDataSource();
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: false}) set content(sort: MatSort) {
    if (!this.componentLoaded && sort) {
      this.sort = sort;
      this.ngAfterViewInit();
      this.componentLoaded = true;
    }
  }
  pageSize = 25;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  totalElements = 0;

  sortCol? = 'created';
  sortDir? = 'desc';
  filterText = '';
  filterRole = 'all';

  constructor(private mapService: MapService,
              private authService: AuthService,
              private router: Router,
              private translate: TranslateService,
              private store: Store<IAppState>) {
    /**
     * NavigationSubscription is required for router onSameUrlNavigation: 'reload'
     * to reload any data for the page component
     */
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        this.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage, sort: `${this.sortCol},${this.sortDir}`, text: this.filterText, role: this.filterRole}));
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage, sort: `${this.sortCol},${this.sortDir}`, text: this.filterText, role: this.filterRole}));
  }

  ngAfterViewInit(): void {
    this.getProjects();
    this.dataSource.paginator = this.paginator;

    if (this.sort) {
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => {
            this.currentPage = this.paginator.pageIndex;
            this.pageSize = this.paginator.pageSize;
            if (this.sort?.direction) {
              this.sortCol = this.sort.active;
              this.sortDir = this.sort.direction;
            }
            else {
              this.sortCol = 'created';
              this.sortDir = 'desc';
            }
            this.store.dispatch(new LoadProjects({
              pageSize: this.pageSize,
              currentPage: this.currentPage,
              sort: `${this.sortCol},${this.sortDir}`,
              text: this.filterText,
              role: this.filterRole
            }))
          })
        ).subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  applyFilter: ReturnType<typeof debounce> = debounce((event: Event) => {
    this.filterText = (event.target as HTMLInputElement).value.trim();
    this.store.dispatch(new LoadProjects({
      pageSize: this.pageSize,
      currentPage: this.currentPage,
      sort: `${this.sortCol},${this.sortDir}`,
      text: this.filterText,
      role: this.filterRole
    }))}, 200);

  applyRoleFilter: ReturnType<typeof debounce> = debounce((event: MatSelectChange) => {
    this.filterRole = event.value;
    this.store.dispatch(new LoadProjects({
      pageSize: this.pageSize,
      currentPage: this.currentPage,
      sort: `${this.sortCol},${this.sortDir}`,
      text: this.filterText,
      role: this.filterRole
    }))}, 200);

  private getProjects(): void {
    const self = this;
    self.subscription.add(self.store.select(selectProjects).subscribe(
      data => {
        if (data) {
          self.projects = data;
          self.projects.forEach(p => {
            if (p.id && p.mapcount) {
              self.selectedMapping[p.id] = p.maps[p.mapcount - 1];
            }
          });
          self.dataSource.data = self.projects;
        }
      },
      error => self.translate.get('ERROR.LOAD_MAPS').subscribe((res) => self.error.message = res)
    ));
    self.subscription.add(self.store.select(selectProjectPage).subscribe(
      data => {
        if (data) {
          self.totalElements = data.totalElements;
          self.pageSize = data.size;
          self.currentPage = data.number;
        }
      }));
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage, sort: `${this.sortCol},${this.sortDir}`, text: this.filterText, role: this.filterRole}));
  }

  createMap(): void {
    this.mode = 'FORM.CREATE';
    this.opened = true;
  }

  closeCreate(): void {
    this.opened = false;
  }

  newVersion(project: Project): void {
    if (project.mapcount === 0) {
      this.translate.get('MAP.NO_MAPS_FOUND').subscribe((res) => this.error.message = `${project.title}: ${res}`);
    } else if (this.currentUser && this.hasProjectRole(project)) {
      const selectedId = this.selectedMapping[project.id]?.id;
      if (selectedId) {
        this.mapService.getMapForId(selectedId).subscribe(res => {
          console.log(res);
          this.newMapping = new Mapping();
          this.newMapping.id = selectedId;  // source of new version
          this.newMapping.project = res.project;
          const newVersion = (+res.mapVersion) + 1;
          this.newMapping.mapVersion = isNaN(newVersion) ? (res.mapVersion + '.1') : newVersion.toString();
          this.newMapping.source = new Source();
          this.newMapping.source.id = '' + res.source.id;
          this.newMapping.toVersion = res.toVersion;
          this.newMapping.toScope = res.toScope;
          this.newMapping.project = project;
          this.mode = 'FORM.COPY';
          this.opened = true;
        });
      }
    }
  }

  viewMapping(project: Project): void {
    if (project.mapcount === 0) {
      this.translate.get('MAP.NO_MAPS_FOUND').subscribe((res) => this.error.message = `${project.title}: ${res}`);
    } else if (this.currentUser && this.hasProjectRole(project)) {
      const mappingid = this.selectedMapping[project.id]?.id;
      this.router.navigate(['map-view', mappingid], {replaceUrl: false});
    }
  }

  isOwner(project: Project): boolean {
    return this.isInRole(project.owners);
  }

  hasProjectRole(project: Project): boolean {
    return this.isInRole(project.owners) || this.isInRole(project.members) || this.isInRole(project.guests)
      || this.isAdmin();
  }

  isAdmin(): boolean {
    return this.currentUser ? this.authService.isAdmin() : false;
  }

  private isInRole(list: User[]): boolean {
    return this.currentUser !== null && list && (list.map(u => u.id).includes(this.currentUser.id) ?? false);
  }
}
