import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MainScreen from '../MainScreen';
import { useNavigation } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';
import { Alert } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../../../components/HeroSection', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return ({ data, onComponentPress, onPlayPress }) => (
    <View testID="mock-hero-section">
      <TouchableOpacity testID="mock-hero-press" onPress={onComponentPress}>
        <Text>{data.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="mock-hero-play" onPress={onPlayPress}>
        <Text>Play Hero</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('../../../components/HorizontalList', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return ({ title, data, onSeeAll, onCardPress, onEdit, onDelete }) => (
    <View testID={`mock-horizontal-list-${title}`}>
      <Text>{title}</Text>
      <TouchableOpacity testID={`mock-hl-seeall-${title}`} onPress={onSeeAll} />
      <TouchableOpacity testID={`mock-hl-edit-${title}`} onPress={onEdit} />
      <TouchableOpacity testID={`mock-hl-delete-${title}`} onPress={onDelete} />
      {data.map(d => (
        <TouchableOpacity key={d.id} testID={`mock-hl-card-${d.id}`} onPress={() => onCardPress(d)}>
          <Text>{d.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

jest.mock('../../../components/Footer', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onDownloadsPress }) => (
    <TouchableOpacity testID="mock-footer" onPress={onDownloadsPress}>
      <Text>Footer</Text>
    </TouchableOpacity>
  );
});

describe('MainScreen', () => {
  const mockNavigate = jest.fn();
  const mockFetchSeries = jest.fn();
  const mockRemoveList = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue({ navigate: mockNavigate });
  });

  const defaultStore = {
    lists: [],
    series: [],
    fetchSeries: mockFetchSeries,
    isLoading: false,
    error: null,
    removeList: mockRemoveList,
    watchProgress: {},
    hasHydrated: true
  };

  it('renders loading state when not hydrated or loading without series', () => {
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      hasHydrated: false,
    });
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders loading state when loading without series', () => {
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      isLoading: true,
      series: [],
    });
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    expect(rootRenderer.root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders no series state and handles refresh', () => {
    useLibraryStore.mockReturnValue(defaultStore);
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    const refreshBtn = root.findByProps({ testID: 'main-refresh-btn' });
    
    act(() => {
      refreshBtn.props.onPress();
    });

    expect(mockFetchSeries).toHaveBeenCalled();
  });

  it('renders offline banner when there is an error', () => {
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      error: 'Network Error',
    });
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    const offlineBtn = root.findByProps({ testID: 'offline-banner' });

    act(() => {
      offlineBtn.props.onPress();
    });
    expect(mockFetchSeries).toHaveBeenCalled();
  });

  it('renders offline banner with offline_mode text when there are series', () => {
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      error: 'Network Error',
      series: [{ id: '1', title: 'S1' }]
    });
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    const offlineText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'main.offline_mode'
    )[0];
    expect(offlineText).toBeTruthy();
  });

  it('renders series, lists, and continue watching correctly', () => {
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      series: [
        {
          id: '1',
          title: 'Serie 1',
          seasons: [
            {
              id: 's1',
              episodes: [
                { id: 'e1', title: 'Ep 1' },
                { id: 'e1_old', title: 'Ep 1 old' },
                { id: 'e1_finished', title: 'Ep 1 finished' },
                { id: 'e2_zero', title: 'Ep 2 zero' }
              ]
            }
          ]
        },
        {
          id: '2',
          title: 'Serie 2',
          seasons: [
            {
              id: 's2',
              episodes: [{ id: 'e2', title: 'Ep 2' }]
            }
          ]
        }
      ],
      lists: [
        { id: 'l1', title: 'My List', seriesIds: ['1'] },
        { id: 'l2', title: 'Empty List', seriesIds: [] }
      ],
      watchProgress: {
        'e1': { positionSec: 10, durationSec: 100, updatedAt: 123456 },
        'e1_old': { positionSec: 15, durationSec: 100, updatedAt: 123450 },
        'e2': { positionSec: 20, durationSec: 100, updatedAt: 123457 },
        'e99': { positionSec: 5, durationSec: 100, updatedAt: 123458 }, // Not in series
        'e3': { positionSec: 5, durationSec: 100, updatedAt: 123459 }, // Missing episode
        'e1_finished': { positionSec: 96, durationSec: 100, updatedAt: 123460 }, // ratio >= 0.95
        'e2_zero': { positionSec: 20, durationSec: 0, updatedAt: 123457 } // duration 0
      }
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    // Trigger ScrollView refreshControl
    const scrollView = root.findByProps({ showsVerticalScrollIndicator: false }); 
    act(() => {
      scrollView.props.refreshControl.props.onRefresh();
    });
    expect(mockFetchSeries).toHaveBeenCalled();

    // Hero section
    const heroPress = root.findByProps({ testID: 'mock-hero-press' });
    act(() => heroPress.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('SerieDetailScreen', { serieId: '1' });

    const heroPlay = root.findByProps({ testID: 'mock-hero-play' });
    act(() => heroPlay.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '1',
      seasonId: 's1',
      episodeId: 'e1',
      title: 'Ep 1'
    });

    // Continue Watching list
    const cwList = root.findByProps({ testID: 'mock-horizontal-list-main.continue_watching' });
    expect(cwList).toBeTruthy();

    const cwCard = root.findAllByProps({ testID: 'mock-hl-card-2' })[0];
    act(() => cwCard.props.onPress({ id: '2' }));
    
    // Test if item not found handles gracefully (no navigation)
    act(() => cwCard.props.onPress({ id: 'invalid_serie' }));

    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      serieId: '2',
      seasonId: 's2',
      episodeId: 'e2',
      title: 'Ep 2'
    });

    // Custom List
    const customList = root.findByProps({ testID: 'mock-horizontal-list-My List' });
    expect(customList).toBeTruthy();

    const listSeeAll = root.findByProps({ testID: 'mock-hl-seeall-My List' });
    act(() => listSeeAll.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('SeeAllScreen', { listId: 'l1' });

    // Custom List onCardPress
    const customListCard = root.findAllByProps({ testID: 'mock-hl-card-1' }).find(n => n.parent.props.testID === 'mock-horizontal-list-My List');
    act(() => customListCard.props.onPress({ id: '1' }));
    expect(mockNavigate).toHaveBeenCalledWith('SerieDetailScreen', { serieId: '1' });

    const listEdit = root.findByProps({ testID: 'mock-hl-edit-My List' });
    act(() => listEdit.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('CreateHorizontalViewScreen', {
      editMode: true,
      listId: 'l1',
      initialTitle: 'My List',
      initialSeriesIds: ['1']
    });

    const listDelete = root.findByProps({ testID: 'mock-hl-delete-My List' });
    act(() => listDelete.props.onPress());
    expect(Alert.alert).toHaveBeenCalled();
    const alertArgs = Alert.alert.mock.calls[0];
    expect(alertArgs[0]).toBe('common.delete');
    
    // Simulate delete press
    const deleteAction = alertArgs[2].find(btn => btn.style === 'destructive');
    act(() => deleteAction.onPress());
    expect(mockRemoveList).toHaveBeenCalledWith('l1');

    // Add list button
    const addBtn = root.findByProps({ testID: 'add-list-btn' });
    act(() => addBtn.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('CreateHorizontalViewScreen');

    // Footer
    const footer = root.findByProps({ testID: 'mock-footer' });
    act(() => footer.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith('DownloadsScreen', { headerTitle: 'main.downloads' });
  });

  it('warns when hero play is pressed but no season/episode exists', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    useLibraryStore.mockReturnValue({
      ...defaultStore,
      series: [
        {
          id: '1',
          title: 'Serie 1'
          // no seasons
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<MainScreen />);
    });
    const root = rootRenderer.root;

    const heroPlay = root.findByProps({ testID: 'mock-hero-play' });
    act(() => heroPlay.props.onPress());
    
    expect(consoleWarnSpy).toHaveBeenCalledWith("No season/episode found for", "1");
    consoleWarnSpy.mockRestore();
  });
});
