import {TestBed} from '@angular/core/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {AuthGuard} from './auth.guard';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRouteSnapshot, RouterStateSnapshot, Routes} from '@angular/router';
import {AuthService} from './_services/auth.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {IAppState, initialAppState} from './store/app.state';
import {isAuthenticated} from './store/auth-feature/auth.selectors';
import {APP_CONFIG} from './app.config';
import {MappingListComponent} from './mapping/mapping-list/mapping-list.component';


export const testRoutes: Routes = [
  {
    path: '',
    component: MappingListComponent,
    pathMatch: 'full',
    data: {
      breadcrumb: 'HOME',
      permissions: 'ALL'
    },
  },
  {path: '**', redirectTo: '/'}
];



describe('Auth Guard', () => {
  let guard: AuthGuard;
  let store: MockStore<IAppState>;
  let testAuthService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(testRoutes),
        HttpClientTestingModule
      ],
      declarations: [
        AppComponent,
        HomeComponent
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        AuthGuard,
        provideMockStore({initialState: initialAppState}),
        AuthService
      ],
    });

    store = TestBed.inject(MockStore);
    guard = TestBed.inject(AuthGuard);
    testAuthService = TestBed.inject(AuthService);
  });

  it('should be creatable', () => expect(guard).toBeTruthy());


  it('should return false if the user state is NOT authenticated', () => {
    isAuthenticated.setResult(false);
    store.refreshState();
    const result = guard.canActivate(new ActivatedRouteSnapshot(), {url: ''} as RouterStateSnapshot);
    expect(result).toBe(false);
  });

  it('should return true if the user state is authenticated and authorized', () => {
    isAuthenticated.setResult(true);
    store.refreshState();
    const result = guard.canActivate(new ActivatedRouteSnapshot(), {url: ''} as RouterStateSnapshot);
    expect(result).toBe(true);
  });
});
