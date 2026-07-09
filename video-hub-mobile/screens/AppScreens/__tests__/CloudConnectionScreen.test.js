import React from 'react';
import renderer, { act } from 'react-test-renderer';
import CloudConnectionScreen from '../CloudConnectionScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api from '../../../lib/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../lib/api', () => ({
  get: jest.fn(),
}));


describe('CloudConnectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders correctly initially and checks AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    // Should show "Connect" button
    const buttons = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'Connect'
    );
    expect(buttons.length).toBeGreaterThan(0);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('cloud-url');
  });

  it('shows connected state if url is found in AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('http://mycloud.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const connectedTexts = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'Connected'
    );
    expect(connectedTexts.length).toBeGreaterThan(0);
  });

  it('handles connection with invalid URL', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    const root = rootRenderer.root;

    // Enter invalid url
    const input = root.findByType('TextInput');
    await act(async () => {
      input.props.onChangeText('invalid-url');
    });

    const connectBtn = root.findByProps({ testID: 'connect-btn' });

    await act(async () => {
      connectBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'common.error',
      'Invalid URL. Must start with http:// or https://'
    );
  });

  it('handles successful connection', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    api.get.mockResolvedValueOnce({ data: 'ok' });
    const onCloudConnected = jest.fn();

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen onCloudConnected={onCloudConnected} />);
    });
    const root = rootRenderer.root;

    const input = root.findByType('TextInput');
    await act(async () => {
      input.props.onChangeText('http://test.com');
    });

    const connectBtn = root.findByProps({ testID: 'connect-btn' });

    await act(async () => {
      await connectBtn.props.onPress();
    });

    expect(api.get).toHaveBeenCalledWith('/health');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cloud-url', 'http://test.com');
    expect(onCloudConnected).toHaveBeenCalledWith('http://test.com');
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Connected to cloud server');
  });

  it('handles connection error', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    api.get.mockRejectedValueOnce(new Error('Network error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    const root = rootRenderer.root;

    const input = root.findByType('TextInput');
    await act(async () => {
      input.props.onChangeText('http://fail.com');
    });

    const connectBtn = root.findByProps({ testID: 'connect-btn' });

    await act(async () => {
      await connectBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to connect to cloud server');
  });

  it('handles disconnect', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('http://mycloud.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    
    const disconnectBtn = root.findByProps({ testID: 'disconnect-btn' });

    await act(async () => {
      disconnectBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalled();
    const alertCall = Alert.alert.mock.calls[0];
    expect(alertCall[0]).toBe('Disconnect Cloud');
    
    // Call the disconnect onPress from the Alert buttons
    const disconnectAction = alertCall[2].find(btn => btn.text === 'Disconnect');
    
    await act(async () => {
      await disconnectAction.onPress();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cloud-url');
  });

  it('handles AsyncStorage error on checkCloudConnection', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('async error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Cloud check error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('renders ActivityIndicator while connecting', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    let resolveApi;
    const promise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    api.get.mockReturnValueOnce(promise);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<CloudConnectionScreen />);
    });
    const root = rootRenderer.root;

    const input = root.findByType('TextInput');
    await act(async () => {
      input.props.onChangeText('http://test.com');
    });

    const connectBtn = root.findByProps({ testID: 'connect-btn' });

    act(() => {
      connectBtn.props.onPress();
    });

    const { ActivityIndicator } = require('react-native');
    expect(root.findByType(ActivityIndicator)).toBeTruthy();

    await act(async () => {
      resolveApi({ data: 'ok' });
    });
  });
});
