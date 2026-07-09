import React from 'react';
import renderer, { act } from 'react-test-renderer';
import CreateHorizontalViewScreen from '../CreateHorizontalViewScreen';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: key => key }))
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ goBack: jest.fn() })),
  useRoute: jest.fn(() => ({ params: {} }))
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('../../../components/VideoCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ data, isSelected, onPress }) => (
    <TouchableOpacity testID={`mock-videocard-${data.id}`} onPress={onPress}>
      <Text>{data.title}</Text>
      <Text>{isSelected ? 'Selected' : 'Not Selected'}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../../../components/Footer', () => {
  const { View } = require('react-native');
  return () => <View testID="mock-footer" />;
});

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('CreateHorizontalViewScreen', () => {
  const mockAddList = jest.fn();
  const mockUpdateList = jest.fn();
  const mockGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue({ goBack: mockGoBack });
    useLibraryStore.mockReturnValue({
      series: [
        { id: '1', title: 'Serie 1' },
        { id: '2', title: 'Serie 2' }
      ],
      addList: mockAddList,
      updateList: mockUpdateList
    });
  });

  it('renders create mode by default', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    
    const root = rootRenderer.root;
    const headerTitle = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'create_list.title'
    );
    expect(headerTitle.length).toBeGreaterThan(0);
  });

  it('renders edit mode with initial params', () => {
    useRoute.mockReturnValue({ 
      params: { 
        editMode: true, 
        listId: 'list123', 
        initialTitle: 'My List', 
        initialSeriesIds: ['1'] 
      } 
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    
    const root = rootRenderer.root;
    const headerTitle = root.findAll(node => 
      node.type === 'Text' && (node.props.children === 'create_list.edit_title' || node.props.children === 'Edit List')
    );
    expect(headerTitle.length).toBeGreaterThan(0);

    const input = root.findByType('TextInput');
    expect(input.props.value).toBe('My List');

    // serie 1 should be selected
    const serie1 = root.findByProps({ testID: 'mock-videocard-1' });
    const selectedText = serie1.findAllByType('Text')[1];
    expect(selectedText.props.children).toBe('Selected');
  });

  it('handles serie selection and deselection', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const serie1 = root.findByProps({ testID: 'mock-videocard-1' });
    
    // Select
    act(() => {
      serie1.props.onPress();
    });
    expect(serie1.findAllByType('Text')[1].props.children).toBe('Selected');

    // Deselect
    act(() => {
      serie1.props.onPress();
    });
    expect(serie1.findAllByType('Text')[1].props.children).toBe('Not Selected');
  });

  it('shows error if category name is empty', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const createBtn = root.findByProps({ testID: 'create-list-btn' });
    act(() => {
      createBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'create_list.error_name');
    expect(mockAddList).not.toHaveBeenCalled();
  });

  it('shows error if no series are selected', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const input = root.findByType('TextInput');
    act(() => {
      input.props.onChangeText('Test List');
    });

    const createBtn = root.findByProps({ testID: 'create-list-btn' });
    act(() => {
      createBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'create_list.error_select');
    expect(mockAddList).not.toHaveBeenCalled();
  });

  it('creates list successfully and goes back', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const input = root.findByType('TextInput');
    act(() => {
      input.props.onChangeText('Test List');
    });

    const serie1 = root.findByProps({ testID: 'mock-videocard-1' });
    act(() => {
      serie1.props.onPress();
    });

    const createBtn = root.findByProps({ testID: 'create-list-btn' });
    act(() => {
      createBtn.props.onPress();
    });

    expect(mockAddList).toHaveBeenCalledWith({ title: 'Test List', seriesIds: ['1'] });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('updates list successfully in edit mode', () => {
    useRoute.mockReturnValue({ 
      params: { editMode: true, listId: 'l1', initialTitle: 'My List', initialSeriesIds: ['1'] } 
    });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const serie2 = root.findByProps({ testID: 'mock-videocard-2' });
    act(() => {
      serie2.props.onPress();
    });

    const updateBtn = root.findByProps({ testID: 'create-list-btn' });
    act(() => {
      updateBtn.props.onPress();
    });

    expect(mockUpdateList).toHaveBeenCalledWith('l1', { title: 'My List', seriesIds: ['1', '2'] });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('goes back when back button is pressed', () => {
    useRoute.mockReturnValue({ params: {} });
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    const root = rootRenderer.root;

    const backBtn = root.findByProps({ testID: 'back-btn' });
    act(() => {
      backBtn.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles undefined params', () => {
    useRoute.mockReturnValue({});
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    expect(rootRenderer.root.findByProps({ testID: 'create-list-btn' })).toBeTruthy();
  });

  it('covers fallback texts when t returns falsy in edit mode', () => {
    // Override the mock temporarily
    const i18n = require('react-i18next');
    i18n.useTranslation.mockReturnValueOnce({ t: () => null });
    
    useRoute.mockReturnValue({ 
      params: { editMode: true } 
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<CreateHorizontalViewScreen />);
    });
    
    const root = rootRenderer.root;
    const headerTexts = root.findAllByType('Text').map(t => t.props.children);
    expect(headerTexts).toContain('Edit List');
    expect(headerTexts).toContain('Update List');
  });
});
