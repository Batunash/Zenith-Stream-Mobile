import React from 'react';
import renderer, { act } from 'react-test-renderer';
import EpisodeAccordion from '../EpisodeAccordion';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('../EpisodeGroup', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ title, isExpanded, onToggle }) => (
    <View testID={`episode-group-${title}`}>
      <TouchableOpacity onPress={onToggle} testID={`toggle-${title}`}>
        <Text>{title}</Text>
      </TouchableOpacity>
      {isExpanded && <Text testID={`expanded-${title}`}>Expanded</Text>}
    </View>
  );
});

describe('EpisodeAccordion', () => {
  const mockSeasons = [
    { id: 's1', title: 'Season 1', episodes: [] },
    { id: 's2', title: 'Season 2', episodes: [] },
  ];

  it('renders seasons and handles toggle correctly', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<EpisodeAccordion seasons={mockSeasons} serieId="1" />);
    });
    const root = rootRenderer.root;

    const findByTestId = (id) => root.findAll((n) => n.props.testID === id);

    expect(findByTestId('episode-group-Season 1').length).toBeGreaterThan(0);
    expect(findByTestId('episode-group-Season 2').length).toBeGreaterThan(0);
    
    // Initially nothing should be expanded
    expect(findByTestId('expanded-Season 1').length).toBe(0);
    
    // Toggle Season 1
    act(() => {
      findByTestId('toggle-Season 1')[0].props.onPress();
    });
    expect(findByTestId('expanded-Season 1').length).toBeGreaterThan(0);
    expect(findByTestId('expanded-Season 2').length).toBe(0);

    // Toggle Season 2 (should close Season 1 and open Season 2)
    act(() => {
      findByTestId('toggle-Season 2')[0].props.onPress();
    });
    expect(findByTestId('expanded-Season 1').length).toBe(0);
    expect(findByTestId('expanded-Season 2').length).toBeGreaterThan(0);

    // Toggle Season 2 again (should close)
    act(() => {
      findByTestId('toggle-Season 2')[0].props.onPress();
    });
    expect(findByTestId('expanded-Season 2').length).toBe(0);
  });
});
