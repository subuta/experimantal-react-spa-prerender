import fs from 'fs'
import path from 'path'

import compose from 'koa-compose'
import serve from 'koa-static'
import c2k from 'koa-connect'

import cheerio from 'cheerio'

const dev = process.env.NODE_ENV !== 'production'
const cwd = process.cwd()

// Default handler for renderToHtml.
const defaultRenderToHtml = async ($, App, ctx) => {
  const React = require('react')
  const { renderToString } = require('react-dom/server')

  $('#app').html(renderToString(React.createElement(App)))

  return $.html()
}

// Force-reload module for development.
const requireFresh = (moduleName) => {
  const clearModule = require('clear-module')
  clearModule(moduleName)
  const m = require(moduleName)
  return m.default || m
}

class UniversalBundler {
  constructor (opts = {}, parcelOpts = {}) {
    this.opts = {
      renderToHtml: defaultRenderToHtml,
      ...opts
    }

    this.parcelOpts = {
      watch: dev,
      outDir: './dist',
      ...parcelOpts
    }

    this.clientBundle = null
    this.serverBundle = null

    this.entryAssetsPath = path.join(cwd, this.parcelOpts.outDir, './entryAssets.json')

    this.renderToHtmlMiddleware = (ctx, next) => next()
  }

  initializeApp () {
    const entryAssets = require(this.entryAssetsPath)
    const clientBundleName = path.resolve(cwd, entryAssets[this.opts.entryHtml])
    const serverBundleName = path.resolve(cwd, entryAssets[this.opts.entryAppComponent])

    this.initializeHtmlRenderer(clientBundleName, serverBundleName)
  }

  initializeBundler () {
    const Bundler = require('parcel-bundler')

    this.clientBundler = new Bundler(
      this.opts.entryHtml,
      {
        watch: this.parcelOpts.watch,
        outDir: path.join(this.parcelOpts.outDir, './client')
      }
    )

    this.serverBundler = new Bundler(
      this.opts.entryAppComponent,
      {
        watch: this.parcelOpts.watch,
        target: 'node',
        outDir: path.join(this.parcelOpts.outDir, './server')
      }
    )

    // Gather client/server bundle references.
    this.clientBundler.on('bundled', (compiledBundle) => {
      this.clientBundle = compiledBundle
    })

    this.serverBundler.on('bundled', (compiledBundle) => {
      this.serverBundle = compiledBundle
    })

    // Schedule server bundle after client bundle.
    this.clientBundler.once('bundled', () => this.serverBundler.bundle())
  }

  initializeHtmlRenderer (entryHtml, entryAppComponent) {
    const $ = cheerio.load(fs.readFileSync(entryHtml, { encoding: 'utf8' }))
    const App = requireFresh(entryAppComponent)
    this.renderToHtmlMiddleware = async (ctx, next) => {
      ctx.body = await this.opts.renderToHtml($, App, ctx)
      return
    }
  }

  // do bundle for production.
  async bundle () {
    this.initializeBundler()
    // Setup html renderer after first bundle end.
    this.serverBundler.once('bundled', () => {
      this.initializeHtmlRenderer(this.clientBundle.name, this.serverBundle.name)
      this.dumpEntryAssets()
    })

    // Start client bundle immediately.
    this.clientBundler.bundle()
  }

  dumpEntryAssets () {
    // Set entryAssets.json contents.
    const entryAssets = {
      [this.entryHtml]: `./${path.relative(cwd, this.clientBundle.name)}`,
      [this.entryAppComponent]: `./${path.relative(cwd, this.serverBundle.name)}`
    }

    // Write entryAssets.json for later use.
    fs.writeFileSync(
      this.entryAssetsPath,
      JSON.stringify(entryAssets, null, 2),
      { encoding: 'utf8' }
    )
  }

  initializeForMiddleware () {
    // Listen for client/server bundle end if in development.
    if (dev) {
      this.initializeBundler()
      // Reload html renderer after every bundle.
      this.serverBundler.on('buildEnd', () => {
        this.initializeHtmlRenderer(this.clientBundle.name, this.serverBundle.name)
      })
      return
    }

    // Only initialize app(without bundler) in production.
    this.initializeApp()
  }

  middleware () {
    this.initializeForMiddleware()

    let middleware = []

    middleware.push(async (ctx, next) => {
      // Pass-through non html request.
      const ext = path.extname(ctx.url)
      if (ext && !(/^.html?$/.test(ext))) {
        return next()
      }
      return this.renderToHtmlMiddleware(ctx, next)
    })

    if (dev) {
      // Use parcel middleware for dev.
      const cbm = c2k(this.clientBundler.middleware())
      middleware.push(async (ctx, next) => {
        // Workaround for koa.
        ctx.status = 200
        return cbm(ctx, next)
      })
    } else {
      // Just serve dist/client files, under the production env.
      middleware.push(serve(path.join(this.parcelOpts.outDir, './client')))
    }

    return compose(middleware)
  }
}

export default UniversalBundler
