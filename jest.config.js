module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|firebase|@firebase))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
}
