import { useAuthStore } from '../useAuthStore';
import api from '../../lib/api';

jest.mock('../../lib/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('sets user and token on success', async () => {
      api.post.mockResolvedValueOnce({
        data: { user: { id: 1, name: 'Test' }, token: 'fake-token' },
      });

      const result = await useAuthStore.getState().login('user', 'pass');

      expect(result).toBe(true);
      expect(useAuthStore.getState().user).toEqual({ id: 1, name: 'Test' });
      expect(useAuthStore.getState().token).toBe('fake-token');
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('sets error on failure with response data', async () => {
      api.post.mockRejectedValueOnce({
        response: { data: { error: 'Invalid credentials' } },
      });

      const result = await useAuthStore.getState().login('user', 'pass');

      expect(result).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('sets default error message on failure without response data', async () => {
      api.post.mockRejectedValueOnce(new Error('Network Error'));

      const result = await useAuthStore.getState().login('user', 'pass');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Login failed');
    });
  });

  describe('register', () => {
    it('sets user and token on success', async () => {
      api.post.mockResolvedValueOnce({
        data: { user: { id: 2, name: 'NewUser' }, token: 'new-token' },
      });

      const result = await useAuthStore.getState().register('user', 'pass');

      expect(result).toBe(true);
      expect(useAuthStore.getState().user).toEqual({ id: 2, name: 'NewUser' });
      expect(useAuthStore.getState().token).toBe('new-token');
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('sets error on failure with response data', async () => {
      api.post.mockRejectedValueOnce({
        response: { data: { error: 'Username taken' } },
      });

      const result = await useAuthStore.getState().register('user', 'pass');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Username taken');
    });

    it('sets default error message on failure without response data', async () => {
      api.post.mockRejectedValueOnce(new Error('Network Error'));

      const result = await useAuthStore.getState().register('user', 'pass');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Register failed');
    });
  });

  describe('fetchProfile', () => {
    it('sets user on success', async () => {
      api.get.mockResolvedValueOnce({
        data: { user: { id: 1, name: 'ProfileUser' } },
      });

      await useAuthStore.getState().fetchProfile();

      expect(useAuthStore.getState().user).toEqual({ id: 1, name: 'ProfileUser' });
    });

    it('logs error on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      api.get.mockRejectedValueOnce(new Error('Fetch Error'));

      await useAuthStore.getState().fetchProfile();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Profile fetch error:', expect.any(Error));
      expect(useAuthStore.getState().user).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('clears user and token', () => {
      useAuthStore.setState({ user: { id: 1 }, token: 'token' });

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });
});
