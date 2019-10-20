module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-env'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    [
      '@babel/plugin-proposal-class-properties',
      {
        'loose': true
      }
    ]
  ],
  babelrcRoots: [
    // Keep the root as a root
    '.',
    // Also consider monorepo packages "root" and load their .babelrc files.
    './packages/*',
    './example/*'
  ]
}
