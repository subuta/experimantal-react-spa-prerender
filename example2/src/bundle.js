import UniversalBundler from './universalBundler'

const bundler = new UniversalBundler({
  entryHtml: './index.html',
  entryAppComponent: './App.js'
})

bundler.bundle()
