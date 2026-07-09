import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AuthStack from '../AuthStack';

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

jest.mock('../../screens/AuthScreens/LoginScreen', () => {
  const React = require('react');
  const View = require('react-native').View;
  return { __esModule: true, default: () => <View testID="mock-login" /> };
});
jest.mock('../../screens/AuthScreens/RegisterScreen', () => {
  const React = require('react');
  const View = require('react-native').View;
  return { __esModule: true, default: () => <View testID="mock-register" /> };
});

describe('AuthStack', () => {
  it('renders stack navigator with all screens', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<AuthStack />);
    });
    const root = rootRenderer.root;
    expect(root.findByProps({ testID: 'mock-navigator' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-Login' })).toBeTruthy();
    expect(root.findByProps({ testID: 'screen-Register' })).toBeTruthy();
  });
});
