import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AppStack from '../AppStack';

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: ({ children }) => <View testID="mock-navigator">{children}</View>,
      Screen: ({ name }) => <View testID={`screen-${name}`} />
    }))
  };
});

jest.mock('../../screens/AppScreens/MainScreen', () => {
  const React = require('react');
  const View = require('react-native').View;
  return { __esModule: true, default: () => <View testID="mock-main" /> };
});
jest.mock('../../screens/AppScreens/SeeAllScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/DownloadsScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/SerieDetailScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/CreateHorizontalViewScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/VideoPlayer', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/SettingsScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../screens/AppScreens/CloudConnectionScreen', () => ({ __esModule: true, default: () => null }));

describe('AppStack', () => {
  it('renders stack navigator with all screens', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<AppStack />);
    });
    const root = rootRenderer.root;
    expect(root.findByProps({ testID: 'mock-navigator' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-Main' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-SeeAllScreen' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-DownloadsScreen' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-CreateHorizontalViewScreen' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-SerieDetailScreen' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-VideoPlayer' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-Profile' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-CloudConnection' })).toBeTruthy();
  });
});
