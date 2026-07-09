import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SerieDetailScreen from '../SerieDetailScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';
import { Alert } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn()
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));


jest.mock('../../../components/Footer', () => {
  const { View } = require('react-native');
  return () => <View testID="mock-footer" />;
});

jest.mock('../../../components/EpisodeAccordion', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return ({ seasons, onDownload, onDelete, onPlay, serieId }) => (
    <View testID="mock-episode-accordion" seasons={seasons}>
      {seasons.map(s => (
        <View key={s.id}>
          {s.episodes?.map(ep => (
            <View key={ep.id}>
              <TouchableOpacity testID={`mock-download-${ep.id}`} onPress={() => onDownload(serieId, ep.id)} />
              <TouchableOpacity testID={`mock-delete-${ep.id}`} onPress={() => onDelete(ep.id, ep.title)} />
              <TouchableOpacity testID={`mock-play-${ep.id}`} onPress={() => onPlay(serieId, ep)} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

describe('SerieDetailScreen', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const mockDownloadEpisode = jest.fn();
  const mockRemoveDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack });
    useRoute.mockReturnValue({ params: { serieId: '1' } });
  });

  const baseStore = {
    downloads: [],
    downloadEpisode: mockDownloadEpisode,
    removeDownload: mockRemoveDownload,
    series: [
      {
        id: '1',
        title: 'Test Serie',
        description: 'Desc',
        localPoster: 'file:///local.jpg',
        poster: 'http://poster.jpg',
        seasons: [
          {
            id: 'sea1',
            order: 2,
            episodes: [
              { id: 'ep2', title: 'Ep 2', order: 2, progress: 0.5, seasonId: 'sea1' },
              { id: 'ep1', title: 'Ep 1', order: 1, progress: 1, seasonId: 'sea1' },
              { id: 'ep3', title: 'Ep 3', order: 3, progress: 0, seasonId: 'sea1' }
            ]
          },
          {
            id: 'sea2',
            order: 1,
            episodes: [
              { id: 'ep4', title: 'Ep 4', order: 1, progress: 0, seasonId: 'sea2' }
            ]
          }
        ]
      },
      {
        id: '2', // Movie
        title: 'Movie',
        seasons: [
          {
            id: 'm1',
            episodes: [{ id: 'epm1', title: 'Movie Ep' }]
          }
        ]
      },
      {
        id: '3', // No episodes
        title: 'Empty',
        seasons: [{ id: 's0', episodes: [] }]
      }
    ]
  };

  it('renders correctly with serie', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findByProps({ testID: 'mock-episode-accordion' })).toBeTruthy();
    
    const img = root.findByProps({ testID: 'detail-image' });
    expect(img.props.source.uri).toBe('file:///local.jpg');
    
    // image fallback
    act(() => {
      img.props.onError();
    });
    expect(img.props.source.uri).toBe('http://poster.jpg');

    // image fallback second time (no-op)
    act(() => {
      img.props.onError();
    });
    expect(img.props.source.uri).toBe('http://poster.jpg');
  });

  it('renders not found if serie not found', () => {
    useRoute.mockReturnValue({ params: { serieId: 'unknown' } });
    useLibraryStore.mockReturnValue(baseStore);

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const notFoundText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'detail.not_found'
    );
    expect(notFoundText.length).toBeGreaterThan(0);
  });

  it('handles play main (resume last watched)', () => {
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    // In mock data, ep2 has progress 0.5, so it should resume ep2
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 'sea1',
      episodeId: 'ep2',
      title: 'Ep 2'
    });
  });

  it('handles play main (movie)', () => {
    useRoute.mockReturnValue({ params: { serieId: '2' } });
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '2',
      seasonId: 'm1',
      episodeId: 'epm1',
      title: 'Movie Ep'
    });
  });

  it('handles play main with no episodes', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useRoute.mockReturnValue({ params: { serieId: '3' } });
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'detail.not_found');
  });

  it('handles play main with undefined seasons', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useRoute.mockReturnValue({ params: { serieId: '4' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      series: [{ id: '4', title: 'Undefined Seasons', seasons: undefined }]
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'detail.not_found');
  });

  it('handles play main with undefined episodes in a season', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useRoute.mockReturnValue({ params: { serieId: '5' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      series: [{ id: '5', title: 'Undefined Episodes', seasons: [{ id: 's1', episodes: undefined }] }]
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'detail.not_found');
  });

  it('handles download episode (success)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue({ ...baseStore, downloads: [] });
    mockDownloadEpisode.mockResolvedValueOnce(true);

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const dlBtn = root.findByProps({ testID: 'mock-download-ep1' });
    await act(async () => {
      await dlBtn.props.onPress();
    });

    expect(mockDownloadEpisode).toHaveBeenCalledWith('1', 'ep1');
    expect(Alert.alert).toHaveBeenCalledWith('detail.download_success_title', 'detail.download_success_msg');
  });

  it('handles download episode (already exists)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue({ 
      ...baseStore, 
      downloads: [{ serieId: '1', episodeId: 'ep1' }] 
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const dlBtn = root.findByProps({ testID: 'mock-download-ep1' });
    await act(async () => {
      await dlBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('detail.download_exists_title', 'detail.download_exists_msg');
    expect(mockDownloadEpisode).not.toHaveBeenCalled();
  });

  it('handles download episode (error)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue({ ...baseStore, downloads: [] });
    mockDownloadEpisode.mockRejectedValueOnce(new Error('Network error'));

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const dlBtn = root.findByProps({ testID: 'mock-download-ep1' });
    await act(async () => {
      await dlBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('detail.download_fail_title', 'Network error');
  });

  it('handles download episode (error without message)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue({ ...baseStore, downloads: [] });
    mockDownloadEpisode.mockRejectedValueOnce({}); // No message

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const dlBtn = root.findByProps({ testID: 'mock-download-ep1' });
    await act(async () => {
      await dlBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('detail.download_fail_title', 'detail.download_fail_msg');
  });

  it('handles delete episode', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useLibraryStore.mockReturnValue(baseStore);

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const delBtn = root.findByProps({ testID: 'mock-delete-ep1' });
    await act(async () => {
      delBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalled();
    const alertArgs = Alert.alert.mock.calls[0];
    
    // Simulate delete press
    const deleteAction = alertArgs[2].find(btn => btn.style === 'destructive');
    await act(async () => {
      await deleteAction.onPress();
    });

    expect(mockRemoveDownload).toHaveBeenCalledWith('ep1');
  });

  it('handles back button', () => {
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const backBtn = root.findByProps({ testID: 'detail-back-button' });
    act(() => {
      backBtn.props.onPress();
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles episode play from accordion', () => {
    useLibraryStore.mockReturnValue(baseStore);
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const epPlayBtn = root.findByProps({ testID: 'mock-play-ep1' });
    act(() => {
      epPlayBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 'sea1',
      episodeId: 'ep1',
      title: 'Ep 1'
    });
  });

  it('handles play main with all episodes watched', () => {
    useLibraryStore.mockReturnValue({
      ...baseStore,
      series: [
        {
          id: '1',
          title: 'All Watched',
          seasons: [
            {
              id: 's1',
              episodes: [{ id: 'e1', title: 'E1', progress: 1, order: 1 }]
            }
          ]
        }
      ]
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 's1',
      episodeId: 'e1',
      title: 'E1'
    });
  });

  it('handles play main with an unwatched episode', () => {
    useLibraryStore.mockReturnValue({
      ...baseStore,
      series: [
        {
          id: '1',
          title: 'Unwatched',
          seasons: [
            {
              id: 's1',
              episodes: [
                { id: 'e1', title: 'E1', progress: 1, order: 1 },
                { id: 'e2', title: 'E2', progress: 0, order: 2 }
              ]
            }
          ]
        }
      ]
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'detail-play-main' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 's1',
      episodeId: 'e2',
      title: 'E2'
    });
  });

  it('renders accordion safely with missing seasons', () => {
    useLibraryStore.mockReturnValue({
      ...baseStore,
      series: [
        {
          id: '1',
          title: 'No seasons array'
        }
      ]
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SerieDetailScreen />);
    });
    const root = rootRenderer.root;
    expect(root.findByProps({ testID: 'mock-episode-accordion' }).props.seasons).toEqual([]);
  });
});
