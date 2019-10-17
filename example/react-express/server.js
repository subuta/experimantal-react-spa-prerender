import express from 'express'

import { UniversalBundler } from 'parcel-u'

const app = express()
const port = 3000

const dev = process.env.NODE_ENV !== 'production'

const bundler = new UniversalBundler({
  entryHtml: './src/index.html'
}, {
  watch: dev
})

app.use(bundler.middleware())

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
