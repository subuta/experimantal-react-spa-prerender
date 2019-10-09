import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import _ from 'lodash'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import path from 'path'

import serve from 'koa-static'

import c2k from 'koa-connect'

import Bundler from 'parcel-bundler'

import clearModule from 'clear-module'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

// const ROOT_DIR = path.resolve(__dirname, '../')
// const DIST_DIR = path.resolve(ROOT_DIR, './dist')

const app = new Koa()

const clientBundler = new Bundler(
  './index.html',
  {
    watch: true,
    outDir: './dist/client'
  }
)

const serverBundler = new Bundler(
  './middleware.js',
  {
    watch: true,
    target: 'node',
    outDir: './dist/server'
  }
)

let bundle = null
let serverMiddleware = (ctx, next) => next()

clientBundler.once('bundled', () => serverBundler.bundle())

clientBundler.on('bundled', (compiledBundle) => {
  bundle = compiledBundle
})

serverBundler.on('bundled', (compiledBundle) => {
  // Force-reload module.
  clearModule(compiledBundle.name)
  const m = require(compiledBundle.name)
  serverMiddleware = m.default || m
})

const cbm = c2k(clientBundler.middleware())

// app.use(serve(DIST_DIR))

app.use(logger())

// Parse body
app.use(koaBody())

app.use((ctx, next) => {
  return serverMiddleware(ctx, next)
})

app.use(async (ctx, next) => {
  if (bundle) {
    const js = _.find(Array.from(bundle.childBundles), { type: 'js' })
    const css = _.find(Array.from(js.childBundles), { type: 'css' })

    // console.log('js = ', js.name)
    // console.log('css = ', css.name)
  }
  ctx.status = 200
  return cbm(ctx, next)
})

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})

exitHook(async (cb) => {
  console.log('Goodbye.\r\n')
  cb()
})
