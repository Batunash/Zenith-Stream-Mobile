import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Serie from '../Serie';
import { useLibraryStore } from '../../store/useLibraryStore';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn(),
}));

describe('Serie', () => {
  const mockSerie = {
    id: '1',
    title: 'Test Serie',
    description: 'Description',
    localPoster: 'file:///local.jpg',
    backdrop: 'http://backdrop.jpg',
    poster: 'http://poster.jpg',
    downloadedEpisodes: [
      { id: 'ep1', title: 'Episode 1' },
      { id: 'ep2', title: 'Episode 2' },
    ],
  };

  const mockToggleDownload = jest.fn();

  beforeEach(() => {
    useLibraryStore.mockReturnValue({
      toggleDownload: mockToggleDownload,
    });
    jest.clearAllMocks();
  });

  const getByText = (root, text) => {
    return root.findAll(node => {
      try {
        return node.type === 'Text' && node.props.children === text;
      } catch (e) { return false; }
    });
  };

  it('renders serie title and description', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} />);
    });
    const root = rootRenderer.root;
    
    expect(getByText(root, 'Test Serie').length).toBeGreaterThan(0);
    expect(getByText(root, 'Description').length).toBeGreaterThan(0);
  });

  it('renders default description if missing', () => {
    const noDescSerie = { ...mockSerie, description: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={noDescSerie} />);
    });
    const root = rootRenderer.root;
    
    expect(getByText(root, 'detail.description_missing').length).toBeGreaterThan(0);
  });

  it('calls onSeriePress when image is pressed', () => {
    const onSeriePress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} onSeriePress={onSeriePress} />);
    });
    const root = rootRenderer.root;
    
    const touchable = root.findByProps({ testID: 'serie-touchable' });
    act(() => {
      touchable.props.onPress();
    });
    
    expect(onSeriePress).toHaveBeenCalledWith('1');
  });

  it('renders downloaded episodes if showDownloadedEpisodes is true', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} showDownloadedEpisodes={true} />);
    });
    const root = rootRenderer.root;
    
    expect(getByText(root, 'Episode 1').length).toBeGreaterThan(0);
    expect(getByText(root, 'Episode 2').length).toBeGreaterThan(0);
  });

  it('does not render downloaded episodes if showDownloadedEpisodes is false', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} showDownloadedEpisodes={false} />);
    });
    const root = rootRenderer.root;
    
    expect(getByText(root, 'Episode 1').length).toBe(0);
  });

  it('calls onPlayPress when episode play is pressed', () => {
    const onPlayPress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} showDownloadedEpisodes={true} onPlayPress={onPlayPress} />);
    });
    const root = rootRenderer.root;
    
    const playButton = root.findByProps({ testID: 'play-btn-ep1' });
    act(() => {
      playButton.props.onPress();
    });
    
    expect(onPlayPress).toHaveBeenCalledWith('1', mockSerie.downloadedEpisodes[0]);
  });

  it('calls handleDeleteEpisode when episode trash is pressed', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} showDownloadedEpisodes={true} />);
    });
    const root = rootRenderer.root;
    
    const trashButton = root.findByProps({ testID: 'delete-btn-ep1' });
    act(() => {
      trashButton.props.onPress();
    });
    
    expect(mockToggleDownload).toHaveBeenCalledWith('1', 'ep1');
  });

  it('falls back to backdrop if localPoster fails', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={mockSerie} />);
    });
    const root = rootRenderer.root;
    
    const image = root.findByProps({ testID: 'serie-image' });
    expect(image.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://backdrop.jpg');
  });

  it('falls back to poster if backdrop fails', () => {
    const noLocalData = { ...mockSerie, localPoster: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={noLocalData} />);
    });
    const root = rootRenderer.root;
    
    const image = root.findByProps({ testID: 'serie-image' });
    expect(image.props.source.uri).toBe('http://backdrop.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://poster.jpg');
  });

  it('falls back to poster directly from localPoster if backdrop is missing', () => {
    const noBackdropData = { ...mockSerie, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={noBackdropData} />);
    });
    const root = rootRenderer.root;
    
    const image = root.findByProps({ testID: 'serie-image' });
    expect(image.props.source.uri).toBe('file:///local.jpg');

    act(() => {
      image.props.onError();
    });
    
    expect(image.props.source.uri).toBe('http://poster.jpg');
  });

  it('handles missing localPoster and backdrop on mount', () => {
    const noLocalNoBackdrop = { ...mockSerie, localPoster: null, backdrop: null };
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={noLocalNoBackdrop} />);
    });
    const root = rootRenderer.root;
    
    const image = root.findByProps({ testID: 'serie-image' });
    expect(image.props.source.uri).toBe('http://poster.jpg');

    act(() => {
      image.props.onError();
    });
    // onError when both are missing or just poster should still be handled safely
  });

  it('handles undefined serie props safely', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<Serie serie={{}} />);
    });
    const root = rootRenderer.root;
    expect(root).toBeTruthy();
  });
});
