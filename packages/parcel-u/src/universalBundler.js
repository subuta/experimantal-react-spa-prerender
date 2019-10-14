import fs from 'fs'
import path from 'path'

import _ from 'lodash'

import compose from 'koa-compose'
import serve from 'koa-static'
import c2k from 'koa-connect'

import cheerio from 'cheerio'

const dev = process.env.NODE_ENV !== 'production'
const cwd = process.cwd()

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
      entryComponent: 'App.js',
      ...opts
    }

    this.parcelOpts = {
      watch: false,
      outDir: './dist',
      killWorkers: false,
      ...parcelOpts
    }

    this.clientBundle = null
    this.serverBundle = null

    this.entryAssetsPath = path.join(cwd, this.parcelOpts.outDir, './entryAssets.json')

    this.doRenderToHtml = async (ctx, next) => next()
  }

  getEntryComponent () {
    // Pass-through if entryComponent looks like relative path.
    if (_.startsWith(this.opts.entryComponent, './')) return this.opts.entryComponent

    // Omit extension even if specified.
    return _.first(this.opts.entryComponent.split('.'))
  }

  findEntryComponentName (clientBundle) {
    const entryComponentName = this.getEntryComponent()

    // Resolve relative pathname if specified.
    if (_.startsWith(entryComponentName, './')) {
      return path.resolve(process.cwd(), entryComponentName)
    }

    const childBundles = Array.from(clientBundle.childBundles)

    // Find entry js file.
    const jsBundle = _.find(childBundles, { type: 'js' })
    const depAssets = Array.from(jsBundle.entryAsset.depAssets.values())

    // Find App.js file.
    const entryAppComponent = _.find(depAssets, (asset) => {
      // Ignore node_modules.
      if (/node_modules\//.test(asset.name)) return
      return _.startsWith(asset.basename, entryComponentName)
    })

    // Return found file name,
    return entryAppComponent ? entryAppComponent.name : ''
  }

  initializeApp (onInitialized = _.noop) {
    const entryAssets = require(this.entryAssetsPath)
    const clientBundleName = path.resolve(cwd, entryAssets[this.opts.entryHtml])
    const serverBundleName = path.resolve(cwd, entryAssets[this.opts.entryComponent])

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
        ...this.parcelOpts,
        outDir: path.join(this.parcelOpts.outDir, './client')
      }
    )

    const initServerBundle = (clientBundle) => {
      const entryComponent = this.findEntryComponentName(clientBundle)

      this.serverBundler = new Bundler(
        entryComponent,
        {
          ...this.parcelOpts,
          target: 'node',
          outDir: path.join(this.parcelOpts.outDir, './server')
        }
      )

      this.serverBundler.on('bundled', (compiledBundle) => {
        this.serverBundle = compiledBundle
      })

      // Reload html renderer after every bundle.
      this.serverBundler.on('buildEnd', () => {
        this.initializeHtmlRenderer(this.clientBundle.name, this.serverBundle.name)
        onInitialized()
      })
    }

    // Gather client/server bundle references.
    this.clientBundler.on('bundled', (compiledBundle) => {
      this.clientBundle = compiledBundle
      initServerBundle(compiledBundle)
    })

    // Schedule server bundle after client bundle.
    this.clientBundler.once('bundled', () => {
      this.serverBundler.bundle()
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

  async stop () {
    let promises = []

    if (this.clientBundler) {
      promises.push(this.clientBundler.stop())
    }

    if (this.serverBundler) {
      promises.push(this.serverBundler.stop())
    }

    await Promise.all(promises)
  }

  async bundle (dumpEntryAssets = !dev) {
    // Do bundle and await.
    await new Promise((resolve) => {
      this.initializeBundler(resolve)
      // Start client bundle immediately.
      this.clientBundler.bundle()
    })

    // Dump assets after bundle.
    if (dumpEntryAssets) {
      this.dumpEntryAssets()
    }

    await this.stop()
  }

  dumpEntryAssets () {
    // Set entryAssets.json contents.
    const entryAssets = {
      [this.opts.entryHtml]: `./${path.relative(cwd, this.clientBundle.name)}`,
      [this.opts.entryComponent]: `./${path.relative(cwd, this.serverBundle.name)}`
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

  initialize () {
    // Listen for client/server bundle end if in development.
    if (dev) {
      return this.initializeBundler()
    }
    // Only initialize app(without bundler) in production.
    this.initializeApp()
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
