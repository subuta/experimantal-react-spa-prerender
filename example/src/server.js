import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import _ from 'lodash'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import path from 'path'

import { source } from 'common-tags'

import serve from 'koa-static'

import React from 'react'

import App from './App'

import { prerender } from '../../src/server'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const ROOT_DIR = path.resolve(__dirname, '../')
const DIST_DIR = path.resolve(ROOT_DIR, './dist')

const app = new Koa()

app.use(serve(DIST_DIR))

app.use(logger())

// Parse body
app.use(koaBody())

app.use(async (ctx, next) => {
  if (ctx.url !== '/') return

  // Render App
  ctx.body = await prerender(App, ctx)
})

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})

exitHook(async (cb) => {
  console.log('Goodbye.\r\n')
  cb()
})
