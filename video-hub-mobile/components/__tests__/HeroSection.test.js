import React from 'react';
import renderer, { act } from 'react-test-renderer';
import HeroSection from '../HeroSection';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('HeroSection', () => {
  const mockData = {
    id: '1',
    title: 'Test Serie',
    localPoster: 'file:///local.jpg',
    backdrop: 'http://backdrop.jpg',
    poster: 'http://poster.jpg',
  };

  const getByText = (root, text) => {
    return root.findAll(node => {
      try {
        return node.type === 'Text' && node.props.children === text;
      } catch (e) { return false; }
    });
  };

  it('renders correctly with given data', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={mockData} />);
    });
    const root = rootRenderer.root;
    
    expect(getByText(root, 'Test Serie').length).toBeGreaterThan(0);
  });

  it('uses default title if data is missing', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={{}} />);
    });
    const root = rootRenderer.root;

    expect(getByText(root, 'main.unknown_title').length).toBeGreaterThan(0);
  });

  it('calls onComponentPress when main container is pressed', () => {
    const onComponentPress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HeroSection data={mockData} onComponentPress={onComponentPress} />
      );
    });
    const root = rootRenderer.root;

    const touchable = root.findByProps({ testID: 'hero-container' });
    act(() => {
      touchable.props.onPressIn();
      touchable.props.onPressOut();
      touchable.props.onPress();
    });
    expect(onComponentPress).toHaveBeenCalled();
  });

  it('calls onPlayPress with serie id when play button is pressed', () => {
    const onPlayPress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HeroSection data={mockData} onPlayPress={onPlayPress} />
      );
    });
    const root = rootRenderer.root;

    const btn = root.findByProps({ testID: 'hero-play' });
    act(() => {
      btn.props.onPressIn();
      btn.props.onPressOut();
      btn.props.onPress();
    });
    expect(onPlayPress).toHaveBeenCalledWith('1');
  });

  it('falls back to backdrop if localPoster fails', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={mockData} />);
    });
    const root = rootRenderer.root;
    
    const imageBg = root.findByProps({ testID: 'hero-image' });
    expect(imageBg.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      imageBg.props.onError();
    });
    
    expect(imageBg.props.source.uri).toBe('http://backdrop.jpg');
  });

  it('falls back to poster if backdrop fails', () => {
    const noLocalData = { ...mockData, localPoster: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={noLocalData} />);
    });
    const root = rootRenderer.root;
    
    const imageBg = root.findByProps({ testID: 'hero-image' });
    expect(imageBg.props.source.uri).toBe('http://backdrop.jpg');

    act(() => {
      imageBg.props.onError();
    });
    
    expect(imageBg.props.source.uri).toBe('http://poster.jpg');
  });

  it('falls back to poster directly from localPoster if backdrop is missing', () => {
    const noBackdropData = { ...mockData, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={noBackdropData} />);
    });
    const root = rootRenderer.root;
    
    const imageBg = root.findByProps({ testID: 'hero-image' });
    expect(imageBg.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      imageBg.props.onError();
    });
    
    expect(imageBg.props.source.uri).toBe('http://poster.jpg');
  });

  it('handles missing localPoster and backdrop on mount', () => {
    const noLocalNoBackdrop = { ...mockData, localPoster: null, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HeroSection data={noLocalNoBackdrop} />);
    });
    const root = rootRenderer.root;
    
    const imageBg = root.findByProps({ testID: 'hero-image' });
    expect(imageBg.props.source.uri).toBe('http://poster.jpg');

    act(() => {
      imageBg.props.onError();
    });
  });
});
