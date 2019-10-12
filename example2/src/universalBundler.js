import fs from 'fs'
import path from 'path'

import _ from 'lodash'

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
      watch: false,
      outDir: './dist',
      ...parcelOpts
    }

    this.clientBundle = null
    this.serverBundle = null

    this.entryAssetsPath = path.join(cwd, this.parcelOpts.outDir, './entryAssets.json')

    this.doRenderToHtml = async (ctx, next) => next()
  }

  initializeApp (onInitialized = _.noop) {
    const entryAssets = require(this.entryAssetsPath)
    const clientBundleName = path.resolve(cwd, entryAssets[this.opts.entryHtml])
    const serverBundleName = path.resolve(cwd, entryAssets[this.opts.entryAppComponent])

    this.initializeHtmlRenderer(clientBundleName, serverBundleName)
    onInitialized()
  }

  initializeBundler (onInitialized = _.noop) {
    const Bundler = require('parcel-bundler')

    // Ensure onInitialized called once.
    onInitialized = _.once(onInitialized)

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

    // Reload html renderer after every bundle.
    this.serverBundler.on('buildEnd', () => {
      this.initializeHtmlRenderer(this.clientBundle.name, this.serverBundle.name)
      onInitialized()
    })
  }

  initializeHtmlRenderer (entryHtml, entryAppComponent) {
    const $ = cheerio.load(fs.readFileSync(entryHtml, { encoding: 'utf8' }))
    const App = requireFresh(entryAppComponent)
    this.doRenderToHtml = async (ctx, next) => {
      ctx.body = await this.opts.renderToHtml($, App, ctx)
      return
    }
  }

  async bundle (dumpEntryAssets = !dev) {
    // Do bundle immediately.
    await new Promise((resolve) => {
      this.initializeBundler(resolve)
      // Start client bundle immediately.
      this.clientBundler.bundle()
    })

    // Dump assets after bundle.
    if (dumpEntryAssets) {
      this.dumpEntryAssets()
    }
  }

  dumpEntryAssets () {
    // Set entryAssets.json contents.
    const entryAssets = {
      [this.opts.entryHtml]: `./${path.relative(cwd, this.clientBundle.name)}`,
      [this.opts.entryAppComponent]: `./${path.relative(cwd, this.serverBundle.name)}`
    }

    // Write entryAssets.json for later use.
    fs.writeFileSync(
      this.entryAssetsPath,
      JSON.stringify(entryAssets, null, 2),
      { encoding: 'utf8' }
    )
  }

  async render (urls) {
    if (dev) {
      await this.bundle()
    } else {
      // Only initialize app(without bundler) in production.
      this.initializeApp()
    }

    let doSingleRender = false

    if (!_.isArray(urls)) {
      urls = [urls]
      doSingleRender = true
    }

    const html = await Promise.all(_.map(urls, async (url) => {
      const ctx = { url }
      await this.doRenderToHtml(ctx, _.noop)
      // Return generated body content.
      return ctx.body
    }))

    return doSingleRender ? _.first(html) : html
  }

  initialize (...args) {
    // Listen for client/server bundle end if in development.
    if (dev) {
      return this.initializeBundler(...args)
    }
    // Only initialize app(without bundler) in production.
    this.initializeApp(...args)
  }

  middleware () {
    this.initialize()

    let middleware = []

    middleware.push(async (ctx, next) => {
      // Pass-through non html request.
      const ext = path.extname(ctx.url)
      if (ext && !(/^.html?$/.test(ext))) {
        return next()
      }
      return this.doRenderToHtml(ctx, next)
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
