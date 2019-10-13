import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import { getOpts, UniversalBundler } from '..'

const port = parseInt(process.env.PORT, 10) || 3000

const app = new Koa()

// Get opts from config or args for cli-usage.
const { opts, parcelOpts } = getOpts()

const bundler = new UniversalBundler(opts, parcelOpts)

app.use(logger())

// Parse body
app.use(koaBody())

app.use(bundler.middleware())

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})

exitHook(async (cb) => {
  console.log('Goodbye.\r\n')
  await bundler.stop()
  cb()
})
