import UniversalBundler from './universalBundler'

const bundler = new UniversalBundler(
  './index.html',
  './App.js'
)

bundler.bundle()
