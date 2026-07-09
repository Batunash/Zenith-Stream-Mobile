import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ConnectionScreen from '../ConnectionScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Keyboard } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

const mockRequestPermission = jest.fn();
let mockPermissionStatus = { granted: true };

jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    CameraView: ({ onBarcodeScanned }) => (
      <View testID="mock-camera" onBarcodeScanned={onBarcodeScanned} />
    ),
    useCameraPermissions: () => [mockPermissionStatus, mockRequestPermission]
  };
});

describe('ConnectionScreen', () => {
  const mockOnConnectionSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
    mockPermissionStatus = { granted: true };
    mockRequestPermission.mockResolvedValue({ granted: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly and checks AsyncStorage on mount', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('http://saved-url.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    const root = rootRenderer.root;
    const input = root.findByType('TextInput');
    expect(input.props.value).toBe('http://saved-url.com');
  });

  it('catches and logs error on mount initialization', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Init error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Başlangıç hatası:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles manual save with valid URL', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen onConnectionSuccess={mockOnConnectionSuccess} />);
    });
    
    const root = rootRenderer.root;
    const input = root.findByType('TextInput');

    await act(async () => {
      input.props.onChangeText('http://new-url.com');
    });

    const saveBtn = root.findByProps({ testID: 'save-btn' });
    
    await act(async () => {
      await saveBtn.props.onPress();
    });

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://new-url.com');
    expect(mockOnConnectionSuccess).toHaveBeenCalledWith('http://new-url.com');
    expect(global.fetch).toHaveBeenCalledWith('http://new-url.com/health');
  });

  it('handles save error and shows alert', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Save failed'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const input = root.findByType('TextInput');

    await act(async () => {
      input.props.onChangeText('http://new-url.com');
    });

    const saveBtn = root.findByProps({ testID: 'save-btn' });
    
    await act(async () => {
      await saveBtn.props.onPress();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Kaydetme hatası:', expect.any(Error));
    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'connection.save_error');
    consoleSpy.mockRestore();
  });

  it('shows error on save with invalid URL', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const input = root.findByType('TextInput');

    await act(async () => {
      input.props.onChangeText('invalid-url');
    });

    const saveBtn = root.findByProps({ testID: 'save-btn' });
    
    await act(async () => {
      await saveBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'connection.invalid_url');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('opens camera if permission granted', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    // CameraView should be rendered
    expect(root.findByProps({ testID: 'mock-camera' })).toBeTruthy();
  });

  it('requests camera permission if not granted', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    mockPermissionStatus = { granted: false };
    
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    expect(mockRequestPermission).toHaveBeenCalled();
    expect(root.findByProps({ testID: 'mock-camera' })).toBeTruthy();
  });

  it('shows error if camera permission denied', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    mockPermissionStatus = { granted: false };
    mockRequestPermission.mockResolvedValueOnce({ granted: false });
    
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'connection.camera_permission_denied');
    expect(() => root.findByProps({ testID: 'mock-camera' })).toThrow();
  });

  it('handles barcode scanned (valid JSON URL)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen onConnectionSuccess={mockOnConnectionSuccess} />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: JSON.stringify({ url: 'http://scanned-url.com' }) });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://scanned-url.com/api');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://scanned-url.com/api');
    expect(mockOnConnectionSuccess).toHaveBeenCalledWith('http://scanned-url.com/api');
  });

  it('handles barcode scanned (valid JSON URL ending with /api)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen onConnectionSuccess={mockOnConnectionSuccess} />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: JSON.stringify({ url: 'http://scanned-url.com/api' }) });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://scanned-url.com/api');
    expect(mockOnConnectionSuccess).toHaveBeenCalledWith('http://scanned-url.com/api');
  });

  it('handles barcode scanned (raw HTTP URL fallback)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen onConnectionSuccess={mockOnConnectionSuccess} />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: 'http://raw-url.com' });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://raw-url.com/api');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://raw-url.com/api');
    expect(mockOnConnectionSuccess).toHaveBeenCalledWith('http://raw-url.com/api');
  });

  it('handles barcode scanned (raw HTTP URL ending with /api)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen onConnectionSuccess={mockOnConnectionSuccess} />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: 'http://raw-url.com/api' });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('server-url', 'http://raw-url.com/api');
    expect(mockOnConnectionSuccess).toHaveBeenCalledWith('http://raw-url.com/api');
  });

  it('handles barcode scanned (invalid JSON with no url field)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });
    await act(async () => {
      await openCameraBtn.props.onPress();
    });
    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: JSON.stringify({ not_url: '123' }) });
    });

    expect(Alert.alert).toHaveBeenCalled();
    const alertArgs = Alert.alert.mock.calls[0];
    expect(alertArgs[1]).toBe('connection.invalid_qr');
  });

  it('handles barcode scanned (invalid string data)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });
    await act(async () => {
      await openCameraBtn.props.onPress();
    });
    const camera = root.findByProps({ testID: 'mock-camera' });
    
    await act(async () => {
      camera.props.onBarcodeScanned({ data: 'invalid-string' });
    });

    expect(Alert.alert).toHaveBeenCalled();
    const alertArgs = Alert.alert.mock.calls[0];
    expect(alertArgs[1]).toBe('connection.read_error');
  });

  it('handles close camera button', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const openCameraBtn = root.findByProps({ testID: 'open-camera-btn' });

    await act(async () => {
      await openCameraBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'mock-camera' })).toBeTruthy();

    const closeBtn = root.findByProps({ testID: 'close-camera-btn' });
    await act(async () => {
      closeBtn.props.onPress();
    });

    expect(() => root.findByProps({ testID: 'mock-camera' })).toThrow();
  });

  it('catches fetch error during initialize', async () => {
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith("Health check fail (normal olabilir):", "Network error");
    consoleLogSpy.mockRestore();
  });

  it('handles getHealthUrl edges (falsy, trailing slash, without onConnectionSuccess)', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('http://my-server.com/api/');
    // simulate fetch catch in handleSave
    global.fetch.mockRejectedValueOnce(new Error('Save fetch error'));

    let rootRenderer;
    await act(async () => {
      // Don't pass onConnectionSuccess
      rootRenderer = renderer.create(<ConnectionScreen />);
    });
    
    const root = rootRenderer.root;
    const input = root.findByType('TextInput');

    await act(async () => {
      input.props.onChangeText('');
    });

    const saveBtn = root.findByProps({ testID: 'save-btn' });
    
    await act(async () => {
      // save with falsy targetUrl -> hits invalid URL alert
      await saveBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'connection.invalid_url');

    // now valid url
    await act(async () => {
      input.props.onChangeText('http://my-server.com/api/');
    });

    await act(async () => {
      await saveBtn.props.onPress();
    });

    // We wait for the fetch catch block
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  });
});
