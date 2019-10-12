import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import UniversalBundler from './src/universalBundler'

import React from 'react'
import { renderToString } from 'react-dom/server'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const app = new Koa()

const bundler = new UniversalBundler({
  entryHtml: './index.html',
  entryAppComponent: './App.js',
  renderToHtml: async ($, App, ctx) => {
    // Change title.
    $('title').text('Rendered at Server')

    // Inject rendered html into container.
    $('#app').html(renderToString(React.createElement(App)))

    return $.html()
  }
}, { watch: dev })

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
