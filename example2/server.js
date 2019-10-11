import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import UniversalBundler from './src/universalBundler'

const port = parseInt(process.env.PORT, 10) || 3000

const app = new Koa()

const bundler = new UniversalBundler(
  './index.html',
  './App.js'
)

app.use(logger())

// Parse body
app.use(koaBody())

app.use(bundler.middleware())

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})

exitHook(async (cb) => {
  console.log('Goodbye.\r\n')
  cb()
})
