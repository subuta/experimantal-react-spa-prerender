module.exports = {
  modules: true,
  plugins: {
    'postcss-modules': {
      globalModulePaths: [
        'app.pcss'
      ]
    },
    tailwindcss: true,
    'postcss-nested': true
  }
}
