import React from 'react';
import renderer, { act } from 'react-test-renderer';
import VideoCard from '../VideoCard';

describe('VideoCard', () => {
  const mockData = {
    id: '1',
    localPoster: 'file:///local.jpg',
    backdrop: 'http://backdrop.jpg',
    poster: 'http://poster.jpg',
  };

  it('renders correctly and handles press', () => {
    const onPress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <VideoCard Height={100} data={mockData} onPress={onPress} />
      );
    });
    
    const root = rootRenderer.root;
    const touchable = root.findByProps({ testID: 'videocard-touchable' });
    act(() => {
      touchable.props.onPress();
    });
    
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows checkmark when isSelected is true', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <VideoCard Height={100} data={mockData} isSelected={true} />
      );
    });
    
    const root = rootRenderer.root;
    const checkmark = root.findByProps({ testID: 'mock-ionicons' });
    expect(checkmark.props.name).toBe('checkmark-circle');
  });

  it('falls back to backdrop if localPoster fails', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<VideoCard Height={100} data={mockData} />);
    });
    
    const root = rootRenderer.root;
    const image = root.findByProps({ testID: 'videocard-image' });
    expect(image.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://backdrop.jpg');
  });

  it('falls back to poster if backdrop fails', () => {
    const noLocalData = { ...mockData, localPoster: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<VideoCard Height={100} data={noLocalData} />);
    });
    
    const root = rootRenderer.root;
    const image = root.findByProps({ testID: 'videocard-image' });
    expect(image.props.source.uri).toBe('http://backdrop.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://poster.jpg');
  });

  it('falls back to poster directly from localPoster if backdrop is missing', () => {
    const noBackdropData = { ...mockData, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<VideoCard Height={100} data={noBackdropData} />);
    });
    
    const root = rootRenderer.root;
    const image = root.findByProps({ testID: 'videocard-image' });
    expect(image.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://poster.jpg');
  });

  it('handles missing localPoster and backdrop on mount', () => {
    const noLocalNoBackdrop = { ...mockData, localPoster: null, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<VideoCard Height={100} data={noLocalNoBackdrop} />);
    });
    
    const root = rootRenderer.root;
    const image = root.findByProps({ testID: 'videocard-image' });
    expect(image.props.source.uri).toBe('http://poster.jpg');

    act(() => {
      image.props.onError();
    });
  });

  it('handles undefined data safely', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<VideoCard Height={100} data={{}} />);
    });
    const root = rootRenderer.root;
    expect(root).toBeTruthy();
  });
});
