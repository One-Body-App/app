const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const { withSentryConfig } = require('@sentry/react-native/metro');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const STUB_MODULES = {
  'expo-camera': require.resolve('./stubs/expo-camera.js'),
};

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: [...assetExts.filter((ext) => ext !== 'svg'), 'bin'],
    sourceExts: [...sourceExts, 'svg'],
    resolveRequest: (context, moduleName, platform) => {
      if (Object.prototype.hasOwnProperty.call(STUB_MODULES, moduleName)) {
        return { filePath: STUB_MODULES[moduleName], type: 'sourceFile' };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = withSentryConfig(mergeConfig(defaultConfig, config));
