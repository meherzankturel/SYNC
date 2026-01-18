const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro bundler configuration for Firebase
 * 
 * This configuration is REQUIRED to fix the "Component auth has not been registered yet" error.
 * Firebase uses CommonJS (.cjs) modules that Metro needs to be configured to handle.
 */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files (Firebase uses these)
config.resolver.sourceExts.push('cjs');

// Disable unstable package exports to avoid module resolution issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

