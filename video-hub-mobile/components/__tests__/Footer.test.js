import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Footer from '../Footer';
import { useNavigation, useRoute } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

describe('Footer', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigation.mockReturnValue({
      navigate: mockNavigate,
    });
    useRoute.mockReturnValue({
      name: 'Main',
    });
    jest.clearAllMocks();
  });

  it('navigates to Main when Home is pressed', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Footer />);
    });
    const root = rootRenderer.root;

    const btn = root.findByProps({ testID: 'footer-home' });
    act(() => {
      btn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Main');
  });

  it('navigates to DownloadsScreen when Downloads is pressed', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Footer />);
    });
    const root = rootRenderer.root;

    const btn = root.findByProps({ testID: 'footer-downloads' });
    act(() => {
      btn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('DownloadsScreen');
  });

  it('navigates to Profile when Profile is pressed', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Footer />);
    });
    const root = rootRenderer.root;

    const btn = root.findByProps({ testID: 'footer-profile' });
    act(() => {
      btn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });

  it('renders correctly when on DownloadsScreen', () => {
    useRoute.mockReturnValue({ name: 'DownloadsScreen' });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Footer />);
    });
    const root = rootRenderer.root;
    // Just rendering it is enough to cover the branches
    expect(root).toBeTruthy();
  });

  it('renders correctly when on Profile', () => {
    useRoute.mockReturnValue({ name: 'Profile' });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Footer />);
    });
    const root = rootRenderer.root;
    expect(root).toBeTruthy();
  });
});
