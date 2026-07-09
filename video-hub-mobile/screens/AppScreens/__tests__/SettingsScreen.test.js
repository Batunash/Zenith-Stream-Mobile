import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SettingsScreen from '../SettingsScreen';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLibraryStore } from '../../../store/useLibraryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

jest.useFakeTimers();

jest.mock('../../../store/useAuthStore', () => ({
  useAuthStore: jest.fn()
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('http://mockserver.com'),
  removeItem: jest.fn().mockResolvedValue(true)
}));

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn()
}), { virtual: true });

jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '2.0.0' } },
  expoConfig: { version: '2.0.0' }
}), { virtual: true });

const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en', changeLanguage: mockChangeLanguage }
  })
}));

const mockSetTheme = jest.fn();
jest.mock('../../../store/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
    getActiveTheme: () => 'dark'
  })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() }))
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 })
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => <mock-icon />
}));

jest.mock('../../../components/Footer', () => () => <mock-footer />);

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly and loads data from AsyncStorage', async () => {
    useAuthStore.mockReturnValue({
      user: { username: 'testuser' },
      logout: jest.fn()
    });
    useLibraryStore.mockReturnValue({
      clearAll: jest.fn(),
      downloads: [1, 2]
    });
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'server-url') return Promise.resolve('http://test-server');
      if (key === 'cloud-url') return Promise.resolve('http://cloud-server');
      return Promise.resolve(null);
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    expect(rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'testuser')).toBeTruthy();
  });

  it('handles logout flow', async () => {
    const logoutMock = jest.fn();
    useAuthStore.mockReturnValue({
      user: { username: 'testuser' },
      logout: logoutMock
    });
    useLibraryStore.mockReturnValue({ clearAll: jest.fn(), downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    // Find logout button (it uses title 'settings.logout')
    const logoutBtn = rootRenderer.root.findAllByType('View')
      .find(v => v.props.style && v.props.style.flexDirection === 'row' && v.parent.type === 'View' && v.parent.props.accessible !== undefined)
      // Actually we can find by text 'settings.logout'
    
    // Instead, let's just trigger onPress on the Touchables
    const { TouchableOpacity } = require('react-native');
    const touchables = rootRenderer.root.findAllByType(TouchableOpacity);
    const logoutTouchable = touchables.find(t => {
      try {
        const texts = t.findAllByType('Text');
        return texts.some(txt => txt.props.children === 'settings.logout');
      } catch (e) {
        return false;
      }
    });

    await act(async () => {
      logoutTouchable.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('settings.logout', 'settings.logout_confirm_msg', expect.any(Array));

    // Simulate pressing confirm
    const buttons = Alert.alert.mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });

    expect(logoutMock).toHaveBeenCalled();
  });

  it('handles disconnect server flow', async () => {
    useAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
    useLibraryStore.mockReturnValue({ clearAll: jest.fn(), downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = rootRenderer.root.findAllByType(TouchableOpacity);
    const disconnectTouchable = touchables.find(t => {
      try {
        const texts = t.findAllByType('Text');
        return texts.some(txt => txt.props.children === 'settings.change_server');
      } catch (e) {
        return false;
      }
    });

    await act(async () => {
      disconnectTouchable.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('settings.disconnect_title', 'settings.disconnect_msg', expect.any(Array));

    // Simulate pressing confirm
    const buttons = Alert.alert.mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('server-url');
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });

  it('handles disconnect server error', async () => {
    useAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
    useLibraryStore.mockReturnValue({ clearAll: jest.fn(), downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.removeItem.mockRejectedValue(new Error('error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = rootRenderer.root.findAllByType(TouchableOpacity);
    const disconnectTouchable = touchables.find(t => {
      try {
        const texts = t.findAllByType('Text');
        return texts.some(txt => txt.props.children === 'settings.change_server');
      } catch (e) {
        return false;
      }
    });

    await act(async () => {
      disconnectTouchable.props.onPress();
    });

    const buttons = Alert.alert.mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'common.restart_error');
  });

  it('handles clear cache flow', async () => {
    const clearAllMock = jest.fn();
    useAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
    useLibraryStore.mockReturnValue({ clearAll: clearAllMock, downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = rootRenderer.root.findAllByType(TouchableOpacity);
    const clearTouchable = touchables.find(t => {
      try {
        const texts = t.findAllByType('Text');
        return texts.some(txt => txt.props.children === 'settings.clear_downloads');
      } catch (e) {
        return false;
      }
    });

    await act(async () => {
      clearTouchable.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('settings.clear_cache_title', 'settings.clear_cache_msg', expect.any(Array));

    const buttons = Alert.alert.mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });

    expect(clearAllMock).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('common.success', 'settings.library_cleared');
  });

  it('navigates to CloudConnection', async () => {
    const mockNavigate = jest.fn();
    require('@react-navigation/native').useNavigation.mockReturnValue({ navigate: mockNavigate });
    useAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
    useLibraryStore.mockReturnValue({ clearAll: jest.fn(), downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = rootRenderer.root.findAllByType(TouchableOpacity);
    const cloudTouchable = touchables.find(t => {
      try {
        const texts = t.findAllByType('Text');
        return texts.some(txt => txt.props.children === 'Cloud Connection');
      } catch (e) {
        return false;
      }
    });

    await act(async () => {
      cloudTouchable.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('CloudConnection');
  });

  it('renders default version if expoConfig is missing', async () => {
    require('expo-constants').expoConfig = null;
    useAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
    useLibraryStore.mockReturnValue({ clearAll: jest.fn(), downloads: [] });
    AsyncStorage.getItem.mockResolvedValue(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });

    const versionText = rootRenderer.root.findAll(node => 
      node.type === 'Text' && typeof node.props.children === 'object' && node.props.children[1] === '1.0.0'
    );
    const textNodes = rootRenderer.root.findAllByType('Text');
    const hasVersionText = textNodes.some(t => {
      let textContent = '';
      if (Array.isArray(t.props.children)) {
        textContent = t.props.children.join('');
      } else if (typeof t.props.children === 'string') {
        textContent = t.props.children;
      }
      return textContent.includes('1.0.0');
    });
    expect(hasVersionText).toBeTruthy();
  });

  it('handles language change', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });
    const languageBtn = rootRenderer.root.findAllByType('Text').find(t => {
        if(typeof t.props.children === 'string') return t.props.children === 'settings.language';
        if(Array.isArray(t.props.children)) return t.props.children.join('') === 'settings.language';
        return false;
    }).parent.parent;
    act(() => {
      languageBtn.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'settings.language',
      '',
      expect.any(Array)
    );
    const alertArgs = Alert.alert.mock.calls.find(c => c[0] === 'settings.language');
    const trButton = alertArgs[2].find(btn => btn.text === 'Türkçe');
    act(() => {
      trButton.onPress();
    });
    expect(mockChangeLanguage).toHaveBeenCalledWith('tr');
  });

  it('handles theme change', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SettingsScreen />);
    });
    const themeBtn = rootRenderer.root.findAllByType('Text').find(t => {
        if(typeof t.props.children === 'string') return t.props.children === 'settings.theme';
        if(Array.isArray(t.props.children)) return t.props.children.join('') === 'settings.theme';
        return false;
    }).parent.parent;
    act(() => {
      themeBtn.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'settings.theme',
      '',
      expect.any(Array)
    );
    const alertArgs = Alert.alert.mock.calls.find(c => c[0] === 'settings.theme');
    const lightButton = alertArgs[2].find(btn => btn.text === 'settings.theme_light');
    act(() => {
      lightButton.onPress();
    });
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
