import React from 'react';
import renderer, { act } from 'react-test-renderer';
import BaseListScreen from '../BaseListScreen';
import { useNavigation } from '@react-navigation/native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: jest.fn(() => ({ goBack: jest.fn() }))
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));

jest.mock('../../../components/Serie', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ serie, onSeriePress, onPlayPress }) => (
    <TouchableOpacity testID={`mock-serie-${serie.id}`} onPress={onSeriePress}>
      <Text>{serie.title}</Text>
      <TouchableOpacity testID={`mock-serie-play-${serie.id}`} onPress={() => onPlayPress(serie.id)}>
        <Text>Play</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

jest.mock('../../../components/Footer', () => {
  const { View } = require('react-native');
  return () => <View testID="mock-footer" />;
});

describe('BaseListScreen', () => {
  const mockData = [
    { id: '1', title: 'Serie 1' },
    { id: '2', title: 'Serie 2' }
  ];

  it('renders correctly with empty data', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<BaseListScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findByProps({ testID: 'mock-footer' })).toBeTruthy();
    
    // Check empty text
    const emptyTexts = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'list.empty_title'
    );
    expect(emptyTexts.length).toBeGreaterThan(0);
  });

  it('renders with data and handles interactions', () => {
    const onSeriePress = jest.fn();
    const onPlayPress = jest.fn();

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <BaseListScreen 
          headerTitle="My Title" 
          listData={mockData} 
          onSeriePress={onSeriePress}
          onPlayPress={onPlayPress}
        />
      );
    });
    const root = rootRenderer.root;

    const serie1 = root.findByProps({ testID: 'mock-serie-1' });
    expect(serie1).toBeTruthy();

    act(() => {
      serie1.props.onPress();
    });
    expect(onSeriePress).toHaveBeenCalledWith('1');

    const playBtn = root.findByProps({ testID: 'mock-serie-play-2' });
    act(() => {
      playBtn.props.onPress();
    });
    expect(onPlayPress).toHaveBeenCalledWith('2');
  });

  it('handles navigation goBack', () => {
    const goBack = jest.fn();
    useNavigation.mockReturnValue({ goBack });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<BaseListScreen />);
    });
    const root = rootRenderer.root;

    // We can't find by icon, but it's a touchable with "Go back to previous screen"
    const backBtn = root.findByProps({ accessibilityLabel: 'Go back to previous screen' });
    act(() => {
      backBtn.props.onPress();
    });

    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('falls back to default header title if missing', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<BaseListScreen />);
    });
    const root = rootRenderer.root;

    // header Text has numberOfLines={1}
    const headerText = root.findAll(node => 
      node.type === 'Text' && node.props.numberOfLines === 1 && node.props.children === 'main.my_list'
    );
    expect(headerText.length).toBeGreaterThan(0);
  });

  it('handles keyExtractor with missing id', () => {
    const dataWithoutId = [{ title: 'No ID' }];
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<BaseListScreen listData={dataWithoutId} />);
    });
    const root = rootRenderer.root;
    // If it rendered without crashing, it used the index as key.
    expect(root).toBeTruthy();
  });
});
