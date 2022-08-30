module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      "module:react-native-dotenv",
      {
        moduleName: "react-native-dotenv",
        path: ".env",
        safe: true,
      }
    ],
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        cwd: 'babelrc',
        extensions: ['.ts', '.tsx', '.js', '.ios.js', '.android.js', '.svg', '.png', '.jpg'],
        alias: {
          "@/utils": "./utils",
          "@/src": "./src",
          "@/assets": "./src/assets",
          "@/components": "./src/Components",
          "@/constants": "./src/constants",
          "@/navigation": "./src/Navigation",
          "@/redux": "./src/Redux",
          "@/screens": "./src/screens",
          "@/services": "./src/Services",
        }
      }
    ],
    'jest-hoist'
  ]
};
