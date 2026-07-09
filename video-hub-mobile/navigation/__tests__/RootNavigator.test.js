import React from 'react';
import renderer, { act } from 'react-test-renderer';
import RootNavigator from '../RootNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => <>{children}</>
}));

jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

jest.mock('../AppStack', () => () => <mock-app-stack />);
jest.mock('../AuthStack', () => () => <mock-auth-stack />);
jest.mock('../../screens/AuthScreens/ConnectionScreen', () => {
  return function MockConnectionScreen({ onConnectionSuccess }) {
    return (
      <mock-connection-screen
        testID="connection-screen"
        onPress={() => onConnectionSuccess('http://new-url.com')}
      />
    );
  };
});
jest.mock('../../screens/splashScreen', () => () => <mock-splash-screen />);

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders SplashScreen initially and then ConnectionScreen if no server-url', async () => {
    useAuthStore.mockReturnValue(null);
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<RootNavigator />);
    });
    
    expect(rootRenderer.root.findByType('mock-splash-screen')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(rootRenderer.root.findByType('mock-connection-screen')).toBeTruthy();
  });

  it('renders AppStack if server-url exists and token exists', async () => {
    useAuthStore.mockReturnValue('valid-token');
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<RootNavigator />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(rootRenderer.root.findByType('mock-app-stack')).toBeTruthy();
  });

  it('renders AuthStack if server-url exists but no token', async () => {
    useAuthStore.mockReturnValue(null);
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<RootNavigator />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(rootRenderer.root.findByType('mock-auth-stack')).toBeTruthy();
  });

  it('handles ConnectionScreen success', async () => {
    useAuthStore.mockReturnValue(null);
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<RootNavigator />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const connScreen = rootRenderer.root.findByType('mock-connection-screen');
    await act(async () => {
      await connScreen.props.onPress();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://new-url.com');
    expect(rootRenderer.root.findByType('mock-auth-stack')).toBeTruthy();
  });

  it('handles AsyncStorage error on init', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    useAuthStore.mockReturnValue(null);
    AsyncStorage.getItem.mockRejectedValue(new Error('async error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<RootNavigator />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Init error:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
