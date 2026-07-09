import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SeeAllScreen from '../SeeAllScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';

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
          {serie.episodes?.map(ep => (
            <TouchableOpacity key={ep.id} onPress={() => onPlayPress(serie.id, ep)} testID={`mock-play-${ep.id}`}>
              <Text>{ep.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
});

describe('SeeAllScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly with list data', () => {
    useRoute.mockReturnValue({ params: { listId: 'list1' } });
    useLibraryStore.mockReturnValue({
      lists: [{ id: 'list1', title: 'My Custom List', seriesIds: ['1'] }],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }]
        },
        { id: '2', title: 'Serie 2' }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SeeAllScreen />);
    });
    const root = rootRenderer.root;

    // Check title is passed to BaseListScreen
    const titleText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'My Custom List'
    );
    expect(titleText.length).toBeGreaterThan(0);

    // Check serie 1 is rendered
    expect(root.findByProps({ testID: 'mock-serie-1' })).toBeTruthy();
    
    // Check serie 2 is NOT rendered
    expect(() => root.findByProps({ testID: 'mock-serie-2' })).toThrow();
  });

  it('falls back to default title and empty list if listId not found', () => {
    useRoute.mockReturnValue({ params: { listId: 'unknown' } });
    useLibraryStore.mockReturnValue({
      lists: [],
      series: []
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SeeAllScreen />);
    });
    const root = rootRenderer.root;

    const titleText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'main.my_list'
    );
    expect(titleText.length).toBeGreaterThan(0);
  });

  it('navigates to SerieDetailScreen on serie press', () => {
    useRoute.mockReturnValue({ params: { listId: 'list1' } });
    useLibraryStore.mockReturnValue({
      lists: [{ id: 'list1', title: 'My Custom List', seriesIds: ['1'] }],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }]
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SeeAllScreen />);
    });
    const root = rootRenderer.root;

    const seriePressBtn = root.findByProps({ testID: 'mock-serie-press-1' });
    act(() => {
      seriePressBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('SerieDetailScreen', { serieId: '1' });
  });

  it('navigates to VideoPlayer on episode play press', () => {
    useRoute.mockReturnValue({ params: { listId: 'list1' } });
    useLibraryStore.mockReturnValue({
      lists: [{ id: 'list1', title: 'My Custom List', seriesIds: ['1'] }],
      series: [
        {
          id: '1',
          title: 'Serie 1',
          episodes: [{ id: 'e1', title: 'Ep 1', seasonId: 's1' }]
        }
      ]
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SeeAllScreen />);
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

  it('handles undefined params and list', () => {
    useRoute.mockReturnValue({});
    useLibraryStore.mockReturnValue({
      lists: [],
      series: []
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<SeeAllScreen />);
    });
    
    expect(rootRenderer.root).toBeTruthy();
  });
});
