import React from 'react';
import renderer, { act } from 'react-test-renderer';
import DownloadsScreen from '../DownloadsScreen';
import { useNavigation } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('../BaseListScreen', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ headerTitle, listData, onSeriePress, onPlayPress }) => (
    <View testID="mock-base-list">
      <Text>{headerTitle}</Text>
      {listData.map(serie => (
        <View key={serie.id} testID={`mock-serie-${serie.id}`}>
          <TouchableOpacity onPress={() => onSeriePress(serie.id)} testID={`mock-serie-press-${serie.id}`}>
            <Text>{serie.title}</Text>
          </TouchableOpacity>
          {serie.downloadedEpisodes?.map(ep => (
            <TouchableOpacity key={ep.id} onPress={() => onPlayPress(serie.id, ep)} testID={`mock-play-${ep.id}`}>
              <Text>{ep.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
});

describe('DownloadsScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly with downloads', () => {
    useLibraryStore.mockReturnValue({
      downloads: [
        { serieId: '1', episodeId: 'e1' },
        { serieId: '1', episodeId: 'e2' }, // Second episode for same serie
        { serieId: '2', episodeId: 'e2' },
        { serieId: '99', episodeId: 'e99' } // orphaned download
      ],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          seasons: [{ episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }] }]
        },
        {
          id: '3', // Missing serie case
          title: 'Serie 3',
          seasons: []
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<DownloadsScreen />);
    });
    const root = rootRenderer.root;

    // Check header
    const baseList = root.findByProps({ testID: 'mock-base-list' });
    expect(baseList).toBeTruthy();
    
    // Serie 1 should be visible
    const serie1 = root.findByProps({ testID: 'mock-serie-1' });
    expect(serie1).toBeTruthy();

    // Missing serie shouldn't crash
  });

  it('navigates to SerieDetailScreen on serie press', () => {
    useLibraryStore.mockReturnValue({
      downloads: [{ serieId: '1', episodeId: 'e1' }],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          seasons: [{ episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }] }]
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<DownloadsScreen />);
    });
    const root = rootRenderer.root;

    const seriePressBtn = root.findByProps({ testID: 'mock-serie-press-1' });
    act(() => {
      seriePressBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('SerieDetailScreen', { serieId: '1' });
  });

  it('navigates to VideoPlayer on episode play press', () => {
    useLibraryStore.mockReturnValue({
      downloads: [{ serieId: '1', episodeId: 'e1' }],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          seasons: [{ episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }] }]
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<DownloadsScreen />);
    });
    const root = rootRenderer.root;

    const playBtn = root.findByProps({ testID: 'mock-play-e1' });
    act(() => {
      playBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 's1',
      episodeId: 'e1',
      title: 'Ep 1'
    });
  });
});
