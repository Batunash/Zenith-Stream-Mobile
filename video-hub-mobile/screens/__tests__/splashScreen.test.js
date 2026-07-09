import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SplashScreen from '../splashScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

describe('SplashScreen', () => {
  it('renders correctly and applies insets', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SplashScreen />);
    });
    
    const root = rootRenderer.root;
    // The top level View should have paddingTop: 10, paddingBottom: 20
    const view = root.findByType('View');
    const style = view.props.style;
    
    // style is an array [styles.container, { paddingTop: 10, paddingBottom: 20 }]
    const dynamicStyle = style.find(s => s && s.paddingTop === 10);
    expect(dynamicStyle).toBeTruthy();
    expect(dynamicStyle.paddingTop).toBe(10);
    expect(dynamicStyle.paddingBottom).toBe(20);

    const image = root.findByType('Image');
    expect(image).toBeTruthy();
  });
});
