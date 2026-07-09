import axios from 'axios';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios', () => {
  const mockUse = jest.fn();
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: mockUse },
      },
    })),
  };
});

describe('api.js', () => {
  let interceptorCallback;
  let interceptorErrorCallback;

  beforeAll(() => {
    // Interceptor is added once at module load, we can extract it
    const reqInterceptor = api.interceptors.request.use.mock.calls[0];
    interceptorCallback = reqInterceptor[0];
    interceptorErrorCallback = reqInterceptor[1];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use cloudUrl if available and format it correctly', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'cloud-url') return Promise.resolve('http://cloud.url');
      if (key === 'server-url') return Promise.resolve('http://local.url');
      return Promise.resolve(null);
    });

    const config = { headers: {} };
    const result = await interceptorCallback(config);

    expect(result.baseURL).toBe('http://cloud.url/api');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('cloud-url');
  });

  it('should use localUrl if cloudUrl is not available', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'cloud-url') return Promise.resolve(null);
      if (key === 'server-url') return Promise.resolve('http://local.url/api');
      return Promise.resolve(null);
    });

    const config = { headers: {} };
    const result = await interceptorCallback(config);

    expect(result.baseURL).toBe('http://local.url/api');
  });

  it('should handle no url gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    AsyncStorage.getItem.mockResolvedValue(null);

    const config = { headers: {} };
    const result = await interceptorCallback(config);

    expect(result.baseURL).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('⚠️ Uyarı: Henüz server-url ayarlanmamış.');
    consoleSpy.mockRestore();
  });

  it('should set Authorization header if token exists', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'auth-storage') return Promise.resolve(JSON.stringify({ state: { token: 'my-token' } }));
      return Promise.resolve(null);
    });

    const config = { headers: {} };
    const result = await interceptorCallback(config);

    expect(result.headers.Authorization).toBe('Bearer my-token');
  });

  it('should not set Authorization header if token is missing in auth-storage', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'auth-storage') return Promise.resolve(JSON.stringify({ state: { } }));
      return Promise.resolve(null);
    });

    const config = { headers: {} };
    const result = await interceptorCallback(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should reject errors in interceptor', async () => {
    const error = new Error('Test Error');
    await expect(interceptorErrorCallback(error)).rejects.toThrow('Test Error');
  });
});
