// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Optional: SVG transformer (only if you import .svg as components)
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg', 'mjs', 'cjs'];

module.exports = config; // no withNativeWind
