const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  crypto: path.resolve(__dirname, 'crypto-shim.js'),
};

module.exports = config;
