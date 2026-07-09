module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "components/**/*.{js,jsx}",
    "lib/**/*.{js,jsx}",
    "navigation/**/*.{js,jsx}",
    "screens/**/*.{js,jsx}",
    "services/**/*.{js,jsx}",
    "store/**/*.{js,jsx}"
  ],
  coverageThreshold: {
    global: {
      statements: 98,
      branches: 93,
      functions: 96,
      lines: 100
    }
  }
};
