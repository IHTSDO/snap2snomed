import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {User} from '../_models/user';
import {Observable} from 'rxjs';
import {APP_CONFIG, AppConfig} from '../app.config';
import {ServiceUtils} from '../_utils/service_utils';
import {map} from 'rxjs/operators';
import {Project} from '../_models/project';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private http: HttpClient) {
  }

  getUserById(user: User | null): Observable<any> {
    if (user) {
      const url = `${this.config.apiBaseUrl}/users/token/${user.id}`;
      const header = {
        headers: new HttpHeaders({
          Authorization: 'Bearer ' + user.token?.access_token,
          'Content-Type': 'application/jwt',
          Accept: '*/*',
        })
      };
      const body = user.token?.id_token;
      return this.http.put(url, body, header);
    } else {
      throw new Error('User not found');
    }
  }

  getUsers(): Observable<User[]> {
    // TODO this really should be handled by paging, or having the control that uses this data paged
    return this.getUsersFromUrl(`${this.config.apiBaseUrl}/users?size=200`);
  }

  getUsersAssignedToTask(projectId: string): Observable<User[]> {
    return this.getUsersFromUrl(`${this.config.apiBaseUrl}/users/search/findUsersAssignedToTasks?projectId=${projectId}`);
  }

  getUsersForProject(project: Project): Observable<{owners: User[], members: User[], guests: User[]}> {
    const url = `${this.config.apiBaseUrl}/projects/${project.id}?projection=listUsers`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get(url, header).pipe(
      map((projectusers: any) => {
        return {
          owners: projectusers.owners.map(toUser),
          members: projectusers.members.map(toUser),
          guests: projectusers.guests.map(toUser),
        };
      }),
    );
  }

  private getUsersFromUrl(url: string): Observable<User[]> {
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get(url, header).pipe(
      map((res: any) => res._embedded.users)
    );
  }
}

function toUser(u: any): User {
  const user = new User();
  return {
    ...user, id: u.id,
    givenName: u.givenName,
    familyName: u.familyName,
    email: u.email
  };
}
