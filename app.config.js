// `NO_STREAMING=1 bun run export` sets the `streaming: false` option of the `expo-router` config
// plugin (only valid once the fix is applied: the published plugin rejects unknown options).
module.exports = {
  name: 'expo-router-complete-render-repro',
  slug: 'expo-router-complete-render-repro',
  version: '1.0.0',
  scheme: 'exporoutercompleterenderrepro',
  web: { output: 'server' },
  plugins: [['expo-router', process.env.NO_STREAMING ? { streaming: false } : {}]],
};
