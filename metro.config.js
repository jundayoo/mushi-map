const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// React Native Web support
config.resolver.alias = {
  '@': __dirname + '/src',
};

// Fix for CustomEvent issue
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add additional extensions
config.resolver.sourceExts.push('cjs');

module.exports = config;
