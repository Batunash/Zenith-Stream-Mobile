export const colors = {
  light: {
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    text: '#000000',
    subText: '#666666',
    primary: '#C6A14A',
    border: '#DDDDDD',
    danger: '#ef4444',
    dangerBg: 'rgba(239,68,68,0.1)',
    headerBg: '#FFFFFF',
    bottomNavBg: '#FFFFFF',
    iconColor: '#333333'
  },
  dark: {
    background: '#121212',
    cardBackground: '#1A1A1A',
    text: '#FFFFFF',
    subText: '#888888',
    primary: '#C6A14A',
    border: '#222222',
    danger: '#ef4444',
    dangerBg: 'rgba(239,68,68,0.2)',
    headerBg: '#1A1A1A',
    bottomNavBg: '#1A1A1A',
    iconColor: '#FFFFFF'
  }
};

export const getThemeColors = (activeTheme) => {
  return colors[activeTheme] || colors.dark;
};
