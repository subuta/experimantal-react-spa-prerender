import { UniversalBundler } from 'parcel-u'

const dev = process.env.NODE_ENV !== 'production'

const bundler = new UniversalBundler({
  entryHtml: './src/index.html'
}, {
  watch: dev
})

bundler.bundle()
