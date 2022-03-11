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

import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {ProjectRole, projectRoles, ProjectUserFilter, User} from '../_models/user';
import {FormControl, NgForm} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../_services/user.service';
import {Project} from '../_models/project';
import {ErrorInfo} from '../errormessage/errormessage.component';
import {MatSort} from '@angular/material/sort';
import {MatSelectChange} from '@angular/material/select';
import {Observable, Subscription} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map} from 'rxjs/operators';

@Component({
  selector: 'app-project-roles',
  templateUrl: './project-roles.component.html',
  styleUrls: ['./project-roles.component.css']
})
export class ProjectRolesComponent implements OnInit {

  @Input() project: Project = new Project();
  @Output() errorEvent = new EventEmitter<any>();
  @Input() readonly = false;
  @ViewChild(MatSort) sort: MatSort = new MatSort();
  @ViewChild('myForm') form: NgForm | undefined;
  members: MatTableDataSource<ProjectUserFilter> = new MatTableDataSource<ProjectUserFilter>();
  projectRoles = projectRoles;
  private taskedUsers$: Observable<User[]> | undefined;
  filterValues: ProjectUserFilter = new ProjectUserFilter();
  displayedColumns = ['username', 'project_role'];
  displayedFilterColumns = ['filter_name', 'filter_role'];

  usernameFilterControl = new FormControl('');
  emailFilterControl = new FormControl('');

  private subscription = new Subscription();
  private debounce = 200;

  constructor(
    public translate: TranslateService,
    private userService: UserService) {
  }

  ngOnInit(): void {

    this.userService.getUsers().subscribe(
      (users: User[]) => {
        if (users && users.length > 0) {
          this.members.data = users.map((u: User) => {
            const projectUser = new ProjectUserFilter();

            projectUser.setUserDetails(u);
            if (this.project.owners.find((us) => us.id === u.id)) {
              projectUser.project_role = ProjectRole.OWNER;
            } else if (this.project.members.find((us) => us.id === u.id)) {
              projectUser.project_role = ProjectRole.MEMBER;
            } else if (this.project.guests.find((us) => us.id === u.id)) {
              projectUser.project_role = ProjectRole.GUEST;
            } else {
              projectUser.project_role = ProjectRole.NONE;
            }
            return projectUser;
          });
        }
        this.members.sort = this.sort;
        this.members.sortData = (data: ProjectUserFilter[], sort: MatSort): ProjectUserFilter[] => {
          const active = sort.active;
          const direction = sort.direction;
          if (!active || direction === '') {
            return data;
          }

          return data.sort((a: ProjectUserFilter, b: ProjectUserFilter) => {
            let comparatorResult = 0;

            if (a !== null && b !== null) {
              switch (active) {
                case 'username':
                  comparatorResult = a.username.localeCompare(b.username);
                  break;
                case 'email':
                  comparatorResult = a.email.localeCompare(b.email);
                  break;
                case 'project_role':
                  comparatorResult = this.getRoleValue(a.project_role) - this.getRoleValue(b.project_role);
                  break;
              }
              // secondary sort order default to name then email address
              if (comparatorResult === 0) {
                comparatorResult = a.username.localeCompare(b.username);
                if (comparatorResult === 0) {
                  comparatorResult = a.email.localeCompare(b.email);
                  if (comparatorResult === 0) {
                    comparatorResult = this.getRoleValue(a.project_role) - this.getRoleValue(b.project_role);
                  }
                }
              }
            } else if (a !== null) {
              comparatorResult = 1;
            } else if (b !== null) {
              comparatorResult = -1;
            }

            return comparatorResult * (direction === 'asc' ? 1 : -1);
          });
        };
        this.members.filterPredicate = (data: ProjectUserFilter): boolean => {
          return (this.filterValues.username === '' ||
              data.username.toLocaleLowerCase().includes(this.filterValues.username.toLocaleLowerCase())) &&
            (this.filterValues.email === '' ||
              data.email.toLocaleLowerCase().includes(this.filterValues.email.toLocaleLowerCase())) &&
            (this.filterValues.project_role === undefined || this.filterValues.project_role.length === 0 ||
              (data.project_role !== undefined && this.filterValues.project_role.includes(data.project_role)));
        };
      },
      (err) => this.translate.get('ERROR.NO_USER_LIST').subscribe((msg) => {
        this.errorEvent.emit({msg, detail: err});
      })
    );

    if (this.project.id) {
      this.taskedUsers$ = this.userService.getUsersAssignedToTask(this.project.id).pipe(
        map((users: User[]) => users),
        // @ts-ignore
        catchError((err: any) => {
          this.translate.get('ERROR.UNABLE_TO_GET_ASSIGNED_USERS', {name: this.project.title}).subscribe((msg) => {
            this.errorEvent.emit({msg, detail: err});
          });
        })
      );
    }

    [this.usernameFilterControl, this.emailFilterControl].forEach((control) => {
      this.subscription.add(control.valueChanges
        .pipe(debounceTime(this.debounce), distinctUntilChanged())
        .subscribe(() => {
          this.applyFilter();
        }));
    });
  }

  applyFilter(): void {
    this.members.filter = this.filterValues.toString();
  }

  getRoleValue(role?: string): number {
    switch (role) {
      case 'OWNER':
        return 0;
      case 'MEMBER':
        return 1;
      case 'GUEST':
        return 2;
      default:
        return 3;
    }
  }

  removeUser(list: User[], user: User): void {
    list.forEach((value, index) => {
      if (value.id === user.id) {
        list.splice(index, 1);
      }
    });
  }

  onRoleChange(event: MatSelectChange): void {
    const projectUser = this.members.data.find(value => value.user?.id === event.source.id);
    if (projectUser?.user) {
      const changedUser = projectUser.user;
      if (this.project.owners.length === 1 && this.project.owners[0].id === changedUser.id && event.value !== ProjectRole.OWNER) {
        this.translate.get('ERROR.PROJECT_MUST_HAVE_OWNER').subscribe((msg) => {
          this.errorEvent.emit({msg, detail: null});
        });
        event.source.value = ProjectRole.OWNER;
      } else {
        let targetRole = event.value;
        if (targetRole === ProjectRole.NONE) {
          this.taskedUsers$?.subscribe(
            (users: User[]) => {
              const found = users.find((u) => u.id === changedUser.id);
              if (found) {
                event.source.value = ProjectRole.GUEST;
                targetRole = ProjectRole.GUEST;
                this.translate.get('ERROR.USER_ASSIGNED_TO_TASK_CANNOT_BE_REMOVED',
                  {name: changedUser.givenName + ' ' + changedUser.familyName}).subscribe((msg) => {
                  this.errorEvent.emit({msg, detail: null});
                });
              } else {
                this.errorEvent.emit(null);
              }
              this.updateRoles(targetRole, changedUser);
            });
        } else {
          this.updateRoles(targetRole, changedUser);
        }
      }
    }
  }

  private updateRoles(targetRole: string, changedUser: User): void {
    switch (targetRole) {
      case ProjectRole.OWNER:
        this.project.owners.push(changedUser);
        this.removeUser(this.project.members, changedUser);
        this.removeUser(this.project.guests, changedUser);
        break;
      case ProjectRole.MEMBER:
        this.project.members.push(changedUser);
        this.removeUser(this.project.owners, changedUser);
        this.removeUser(this.project.guests, changedUser);
        break;
      case ProjectRole.GUEST:
        this.project.guests.push(changedUser);
        this.removeUser(this.project.owners, changedUser);
        this.removeUser(this.project.members, changedUser);
        break;
      case ProjectRole.NONE:
        this.removeUser(this.project.owners, changedUser);
        this.removeUser(this.project.members, changedUser);
        this.removeUser(this.project.guests, changedUser);
        break;
    }
  }
}
