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
import {Subscription} from 'rxjs';
import {Mapping} from 'src/app/_models/mapping';
import {Source} from 'src/app/_models/source';
import {AuthService} from '../../_services/auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSelectChange} from "@angular/material/select";
import {MatSort} from '@angular/material/sort';
import {debounce} from "lodash";


@Component({
  selector: 'app-mapping-list',
  templateUrl: './mapping-list.component.html',
  styleUrls: ['./mapping-list.component.css']
})
export class MappingListComponent implements OnInit, AfterViewInit, OnDestroy {
  error: ErrorInfo = {};
  projects: Project[] = [];

  columnsToDisplay = ['title', 'description', 'modified', 'users', 'version', 'actions'];
  roles = {
    name: 'roles',
    options: ['all', 'owner', 'member', 'guest'],
    defaultValue: 'all'
  };

  filterDictionary = new Map<string, string>();

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
        this.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage}));
      }
    });
  }

  ngOnInit(): void {
    const self = this;
    self.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage}));
    self.dataSource.filterPredicate = function (record, filter) {
      const filters: Map<string, string> = new Map(JSON.parse(filter));
      const matches: boolean[] = [];
      let isMatch = false;

      /**
       * filter priority: text, role
       */

      filters.forEach((value, key) => {
        if (key === 'text') {
          if (value.trim().length > 0) {
            matches.push(!!(record.title?.toLocaleLowerCase().includes(value) || record.description?.toLocaleLowerCase().includes(value)));
          }
        }
        else if (key === 'role' && self.currentUser) {
          switch (value) {
            case 'owner':
              matches.push(record.owners.filter(user => user.id == self.currentUser?.id).length > 0);
              break;
            case 'member':
              matches.push(record.members.filter(user => user.id == self.currentUser?.id).length > 0);
              break;
            case 'guest':
              matches.push(record.guests.filter(user => user.id == self.currentUser?.id).length > 0);
              break;
            default:
              matches.push(true);
          }
        }
      });

      return matches.every(e => e);
    };
  }

  ngAfterViewInit(): void {
    this.getProjects();
    this.dataSource.paginator = this.paginator;
    // if (this.sort) {
    //   if (this.paging.sortCol) {
    //     this.sort.active = this.paging.sortCol;
    //   }
    //   switch (this.paging.sortDirection) {
    //     case 'asc':
    //     case 'desc':
    //       this.sort.direction = this.paging.sortDirection;
    //   }
      // this.sort.sortChange.emit();  // Work-around to initialise view

      // merge(this.sort.sortChange, this.paginator.page)
      //   .pipe(tap(() => {
      //       this.paging.pageIndex = this.paginator.pageIndex;
      //       this.paging.pageSize = this.paginator.pageSize;
      //       this.paging.sortCol = this.sort?.active;
      //       this.paging.sortDirection = this.sort?.direction;
      //       this.filterRows();
      //     })
      //   ).subscribe();
    // }
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
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterDictionary.set('text', filterValue.trim().toLowerCase());
    const json = JSON.stringify(Array.from(this.filterDictionary.entries()));
    this.dataSource.filter = json;
  }, 200);

  applyRoleFilter: ReturnType<typeof debounce> = debounce((event: MatSelectChange) => {
    this.filterDictionary.set('role', event.value);
    const json = JSON.stringify(Array.from(this.filterDictionary.entries()));
    this.dataSource.filter = json;
  }, 200);

  private getProjects(): void {
    const self = this;
    self.subscription.add(self.store.select(selectProjects).subscribe(
      data => {
        if (data) {
          const sortData = Object.assign([], data);
          self.projects = sortData.sort((a, b) => self.sortProjects(a, b));
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
    this.store.dispatch(new LoadProjects({pageSize: this.pageSize, currentPage: this.currentPage}));
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

// Sort by created desc
  sortProjects(a: Project, b: Project): number {
    if (a.created && b.created) {
      if (a.created > b.created) {
        return -1;
      }
      if (a.created < b.created) {
        return 1;
      }
    }
    return 0;
  }

}
