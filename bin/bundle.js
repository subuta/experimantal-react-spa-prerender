import UniversalBundler from '../src/universalBundler'

const bundler = new UniversalBundler({
  entryHtml: './example3/src/index.html',
  entryAppComponent: './example3/src/App.js',
})

bundler.bundle()
