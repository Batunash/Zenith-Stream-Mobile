import React from 'react';
import renderer, { act } from 'react-test-renderer';
import EpisodeGroup from '../EpisodeGroup';
import { useLibraryStore } from '../../store/useLibraryStore';

jest.mock('../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn(),
}));

describe('EpisodeGroup', () => {
  const mockEpisodes = [
    { id: 'ep1', title: 'Episode 1', duration: '45 min' },
    { id: 'ep2', title: 'Episode 2', duration: '50 min' },
  ];

  beforeEach(() => {
    useLibraryStore.mockReturnValue({
      downloads: [],
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

  it('renders title and toggles on press', () => {
    const onToggle = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={false}
          onToggle={onToggle}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    expect(getByText(root, 'Season 1').length).toBeGreaterThan(0);
    
    // The touchable is typically wrapping the title, but let's find the header container
    // We didn't set a testID for the toggle in the test, so we can find the TouchableOpacity that has the onToggle.
    const touchable = root.findByProps({ onPress: onToggle });
    act(() => {
      touchable.props.onPress();
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders episodes when expanded', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={true}
          onToggle={jest.fn()}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    expect(getByText(root, 'Episode 1').length).toBeGreaterThan(0);
    expect(getByText(root, '45 min').length).toBeGreaterThan(0);
    expect(getByText(root, 'Episode 2').length).toBeGreaterThan(0);
  });

  it('does not render episodes when not expanded', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={false}
          onToggle={jest.fn()}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    expect(getByText(root, 'Episode 1').length).toBe(0);
  });

  it('calls onPlay when play button is pressed', () => {
    const onPlay = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={true}
          onToggle={jest.fn()}
          onPlay={onPlay}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'play-btn-ep1' });
    act(() => {
      playBtn.props.onPress();
    });
    expect(onPlay).toHaveBeenCalledWith('1', mockEpisodes[0]);
  });

  it('calls onDownload when action button is pressed and episode is not downloaded', () => {
    const onDownload = jest.fn();
    useLibraryStore.mockReturnValue({
      downloads: [],
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={true}
          onToggle={jest.fn()}
          onDownload={onDownload}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    const actionBtn = root.findByProps({ testID: 'action-btn-ep2' });
    act(() => {
      actionBtn.props.onPress();
    });
    expect(onDownload).toHaveBeenCalledWith('1', 'ep2');
  });

  it('calls onDelete when action button is pressed and episode is downloaded', () => {
    const onDelete = jest.fn();
    useLibraryStore.mockReturnValue({
      downloads: [{ serieId: '1', episodeId: 'ep2' }],
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <EpisodeGroup
          title="Season 1"
          episodes={mockEpisodes}
          isExpanded={true}
          onToggle={jest.fn()}
          onDelete={onDelete}
          serieId="1"
        />
      );
    });
    const root = rootRenderer.root;

    const actionBtn = root.findByProps({ testID: 'action-btn-ep2' });
    act(() => {
      actionBtn.props.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith('ep2', 'Episode 2');
  });
});
