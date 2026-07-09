import { useThemeStore } from '../useThemeStore';
import { Appearance } from 'react-native';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' });
    jest.clearAllMocks();
  });

  it('should have default theme as dark', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should set theme correctly', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should return active theme when theme is not system', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().getActiveTheme()).toBe('light');
  });

  it('should return system scheme when theme is system', () => {
    useThemeStore.getState().setTheme('system');
    
    Appearance.getColorScheme = jest.fn().mockReturnValue('dark');
    expect(useThemeStore.getState().getActiveTheme()).toBe('dark');

    Appearance.getColorScheme = jest.fn().mockReturnValue('light');
    expect(useThemeStore.getState().getActiveTheme()).toBe('light');
    
    Appearance.getColorScheme = jest.fn().mockReturnValue(null);
    expect(useThemeStore.getState().getActiveTheme()).toBe('dark'); // fallback to dark
  });
});
