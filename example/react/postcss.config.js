module.exports = {
  modules: true,
  plugins: {
    'postcss-modules': {
      globalModulePaths: [
        'global.pcss'
      ]
    },
    tailwindcss: true,
    'postcss-nested': true
  }
}
