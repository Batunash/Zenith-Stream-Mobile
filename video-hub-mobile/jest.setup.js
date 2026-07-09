

import { Dimensions } from 'react-native';
jest.setTimeout(30000);
Dimensions.get = jest.fn().mockReturnValue({ width: 400, height: 800 });

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-video
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
  })),
  VideoView: 'VideoView',
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  class MockFile {
    constructor(directory, name) {
      if (arguments.length === 1) {
        this.uri = directory;
      } else {
        this.uri = `${directory}/${name}`;
      }
      this._exists = true;
    }
    get exists() {
      return this._exists;
    }
    delete() {}
  }
  MockFile.downloadFileAsync = jest.fn((url, dest) => Promise.resolve(dest));

  return {
    downloadAsync: jest.fn(),
    documentDirectory: 'file:///test-directory/',
    makeDirectoryAsync: jest.fn(),
    getInfoAsync: jest.fn(),
    File: MockFile,
    Paths: {
      document: 'file:///document-directory'
    }
  };
});

// Mock expo-keep-awake
jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props) => React.createElement(View, { testID: 'mock-ionicons', ...props }),
  };
});

// Mock expo-screen-orientation
jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  unlockAsync: jest.fn(),
  OrientationLock: {
    PORTRAIT_UP: 1,
    LANDSCAPE: 3,
  },
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((v) => v),
    withTiming: jest.fn((v) => v),
  };
});

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});
