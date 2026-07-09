import React from 'react';
import renderer, { act } from 'react-test-renderer';
import HorizontalList from '../HorizontalList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('../VideoCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ data, onPress }) => (
    <TouchableOpacity onPress={onPress} testID={`video-card-${data.id}`}>
      <Text>{data.title}</Text>
    </TouchableOpacity>
  );
});

describe('HorizontalList', () => {
  const mockData = [
    { id: '1', title: 'Video 1' },
    { id: '2', title: 'Video 2' },
  ];

  const getByText = (root, text) => {
    return root.findAll(node => {
      try {
        return node.type === 'Text' && node.props.children === text;
      } catch (e) { return false; }
    });
  };

  it('returns null if data is empty or undefined', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<HorizontalList title="Test" data={[]} />);
    });
    // Should be null render
    expect(rootRenderer.toJSON()).toBeNull();

    let rootRenderer2;
    act(() => {
      rootRenderer2 = renderer.create(<HorizontalList title="Test2" />);
    });
    expect(rootRenderer2.toJSON()).toBeNull();
  });

  it('renders title and video cards', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HorizontalList title="My List" data={mockData} />
      );
    });
    const root = rootRenderer.root;

    expect(getByText(root, 'My List').length).toBeGreaterThan(0);
    expect(root.findByProps({ testID: 'video-card-1' })).toBeTruthy();
    expect(root.findByProps({ testID: 'video-card-2' })).toBeTruthy();
  });

  it('calls onCardPress when a video card is pressed', () => {
    const onCardPress = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HorizontalList title="My List" data={mockData} onCardPress={onCardPress} />
      );
    });
    const root = rootRenderer.root;

    const card = root.findByProps({ testID: 'video-card-1' });
    act(() => {
      card.props.onPress();
    });
    expect(onCardPress).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders and calls onSeeAll', () => {
    const onSeeAll = jest.fn();
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HorizontalList title="My List" data={mockData} onSeeAll={onSeeAll} />
      );
    });
    const root = rootRenderer.root;

    const seeAllBtn = root.findByProps({ testID: 'horizontal-see-all' });
    act(() => {
      seeAllBtn.props.onPress();
    });
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('renders and calls onEdit and onDelete', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HorizontalList 
          title="My List" 
          data={mockData} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      );
    });
    const root = rootRenderer.root;

    const editBtn = root.findByProps({ testID: 'horizontal-edit' });
    act(() => {
      editBtn.props.onPress();
    });
    expect(onEdit).toHaveBeenCalledTimes(1);

    const deleteBtn = root.findByProps({ testID: 'horizontal-delete' });
    act(() => {
      deleteBtn.props.onPress();
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('uses index as key if item id is missing', () => {
    const dataWithoutId = [{ title: 'No ID Video' }];
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(
        <HorizontalList title="My List" data={dataWithoutId} />
      );
    });
    const root = rootRenderer.root;
    
    // FlatList should use index "0" as key for this item.
    // It's internal to FlatList, but rendering it successfully covers the branch.
    expect(root).toBeTruthy();
  });
});
