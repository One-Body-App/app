module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './.babelrc' }],
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^\\.\\./Libraries/Components/RefreshControl/__mocks__/RefreshControlMock$':
      '<rootDir>/jest/RefreshControlMock.js',
    '^react-native/Libraries/Components/RefreshControl/__mocks__/RefreshControlMock$':
      '<rootDir>/jest/RefreshControlMock.js',
    '\\.(png|jpg|jpeg|gif|svg|ttf|otf|wav|mp3|m4a)$': '<rootDir>/jest/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native.*|react-native-.*|@react-navigation|@dreamwalk-os/react-native-image-modal|react-redux|redux-persist|@reduxjs|immer)/)',
  ],
};
