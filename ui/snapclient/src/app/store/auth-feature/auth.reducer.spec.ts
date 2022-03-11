import {authReducer, initialAuthState} from './auth.reducer';
import {LogInFailure, LogInSuccess, LoadUserFailure, LoadUserSuccess, UnloadUser} from './auth.actions';
import {TokenMsg, User, UserInfo} from '../../_models/user';

describe('Auth Reducer', () => {
  describe('an unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = authReducer(initialAuthState, action);

      expect(result).toBe(initialAuthState);
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('a successful login action', () => {
    it('should return authenticated state', () => {
      const action = new LogInSuccess({
        token: new TokenMsg('', '', '', '', 1234),
        userinfo: new UserInfo('', '', '', '')});
      const result = authReducer(initialAuthState, action);
      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toBeTruthy();
    });
  });

  describe('a failed login action', () => {
    it('should return unauthenticated state', () => {
      const action = new LogInFailure({error: 'Login failed'});
      const result = authReducer(initialAuthState, action);
      expect(result.isAuthenticated).toBe(false);
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('a successful user action', () => {
    it('should return user', () => {
      const user = new User();
      user.givenName = 'Test';
      user.familyName = 'Test';
      user.email = 'Test@test.com';
      const action = new LoadUserSuccess({user, navigation: false});
      const result = authReducer(initialAuthState, action);
      expect(result.currentuser).toBeTruthy();
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a failed login action', () => {
    it('should return null state', () => {
      const action = new LoadUserFailure({error: 'User load failed'});
      const result = authReducer(initialAuthState, action);
      expect(result.currentuser).toBeFalsy();
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('a remove user action', () => {
    it('should return initial state', () => {
      const action = new UnloadUser();
      const result = authReducer(initialAuthState, action);
      expect(result.currentuser).toBeFalsy();
      expect(result.errorMessage).toBeFalsy();
    });
  });
});
