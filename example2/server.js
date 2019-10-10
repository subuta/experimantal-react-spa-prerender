import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import React from 'react'
import { renderToString } from 'react-dom/server'

import _ from 'lodash'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import path from 'path'
import fs from 'fs'

import serve from 'koa-static'

import c2k from 'koa-connect'

import Bundler from 'parcel-bundler'

import clearModule from 'clear-module'

import { source } from 'common-tags'

import cheerio from 'cheerio'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const ROOT_DIR = path.resolve(__dirname, './')
const DIST_DIR = path.resolve(ROOT_DIR, './dist')

const app = new Koa()

const clientBundler = new Bundler(
  './index.html',
  {
    watch: true,
    outDir: './dist/client'
  }
)

const serverBundler = new Bundler(
  './App.js',
  {
    watch: true,
    target: 'node',
    outDir: './dist/server'
  }
)

let clientBundle = null
let serverBundle = null
let renderReactMiddleware = (ctx, next) => next()
let $ = null

// Force-reload module.
const requireFresh = (moduleName) => {
  clearModule(moduleName)
  const m = require(moduleName)
  return m.default || m
}

clientBundler.once('bundled', () => serverBundler.bundle())

clientBundler.on('bundled', (compiledBundle) => {
  clientBundle = compiledBundle
})

clientBundler.on('buildEnd', () => {
  $ = cheerio.load(fs.readFileSync(clientBundle.name, { encoding: 'utf8' }))
})

serverBundler.on('bundled', (compiledBundle) => {
  serverBundle = compiledBundle
})

serverBundler.on('buildEnd', () => {
  const App = React.createElement(requireFresh(serverBundle.name))
  renderReactMiddleware = (ctx, next) => {
    if (ctx.url === '/react') {
      $('#app').html(renderToString(App))
      ctx.body = $.html()
      return
    }
    return next()
  }
})

const cbm = c2k(clientBundler.middleware())

app.use(logger())

// Parse body
app.use(koaBody())

app.use(renderReactMiddleware)

app.use(async (ctx, next) => {
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
