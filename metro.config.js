const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Force Metro to include .sqlite and .db files
config.resolver.assetExts.push('sqlite', 'db');

module.exports = config;