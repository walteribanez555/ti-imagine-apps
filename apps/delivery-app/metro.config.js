const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro can resolve workspace packages
config.watchFolders = [workspaceRoot];

// Prefer the app's own node_modules first, then fall back to the workspace root.
// This prevents Metro from accidentally picking up a different React copy
// if versions ever diverge again during a workspace install.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
