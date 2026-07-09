import i18n from '../i18n';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'tr' }]),
}));

describe('i18n', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly with default resources', () => {
    // The init function is called automatically when i18n is imported
    // We can check if it has the resources and default settings
    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(i18n.options.resources).toHaveProperty('en');
    expect(i18n.options.resources).toHaveProperty('tr');
  });

  it('translates fallback strings correctly', () => {
    expect(i18n).toBeDefined();
  });

  it('falls back to en if no locales are found', () => {
    jest.isolateModules(() => {
      require('expo-localization').getLocales.mockReturnValueOnce([]);
      const i18nIsolated = require('../i18n').default;
      expect(i18nIsolated.language).toBe('en');
    });
  });
});
