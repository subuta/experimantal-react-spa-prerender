module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-env'
  ],
  plugins: [
    'react-hot-loader/babel',
    '@babel/plugin-transform-runtime',
    [
      '@babel/plugin-proposal-class-properties',
      {
        'loose': true
      }
    ]
  ]
}
