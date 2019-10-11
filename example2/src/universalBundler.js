import React from 'react'

import c2k from 'koa-connect'

import fs from 'fs'

import path from 'path'

import compose from 'koa-compose'

import serve from 'koa-static'

import createRenderToHtmlRenderer from './renderToHtmlRenderer'

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
  constructor (htmlFile, appComponentFile, opts = {}) {
    this.htmlFile = htmlFile
    this.appComponentFile = appComponentFile

    this.opts = {
      watch: dev,
      outDir: './dist',
      ...opts
    }

    this.clientBundle = null
    this.serverBundle = null

    this.entryAssetsPath = path.join(cwd, this.opts.outDir, './entryAssets.json')

    this.renderToHtmlRenderer = (ctx, next) => next()
  }

  initializeApp () {
    const entryAssets = require(this.entryAssetsPath)
    const clientBundleName = path.resolve(cwd, entryAssets[this.htmlFile])
    const serverBundleName = path.resolve(cwd, entryAssets[this.appComponentFile])

    this.initializeHtmlRenderer(clientBundleName, serverBundleName)
  }

  initializeBundler () {
    const Bundler = require('parcel-bundler')

    this.clientBundler = new Bundler(
      this.htmlFile,
      {
        watch: this.opts.watch,
        outDir: path.join(this.opts.outDir, './client')
      }
    )

    this.serverBundler = new Bundler(
      this.appComponentFile,
      {
        watch: this.opts.watch,
        target: 'node',
        outDir: path.join(this.opts.outDir, './server')
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

  initializeHtmlRenderer (bundledHtmlFile, bundledAppComponentFile) {
    const html = fs.readFileSync(bundledHtmlFile, { encoding: 'utf8' })
    const App = React.createElement(requireFresh(bundledAppComponentFile))
    this.renderToHtmlRenderer = createRenderToHtmlRenderer(html, App)
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
      [this.htmlFile]: `./${path.relative(cwd, this.clientBundle.name)}`,
      [this.appComponentFile]: `./${path.relative(cwd, this.serverBundle.name)}`
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
      return this.renderToHtmlRenderer(ctx, next)
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
      middleware.push(serve(path.join(this.opts.outDir, './client')))
    }

    return compose(middleware)
  }
}

export default UniversalBundler
