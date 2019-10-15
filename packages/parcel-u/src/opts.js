import path from 'path'
import fs from 'fs'
import arg from 'arg'

import findUp from 'find-up'

import _ from 'lodash'

const dev = process.env.NODE_ENV !== 'production'

// Parse common options from args and configuration.
export default (argv) => {
  let cwd = process.cwd()

  const args = arg({
    // Args
    '--entry-html': String,
    '--entry-component': String,
    '--config': String,
    '--out-dir': String,

    // Parcel Args.
    '--watch': Boolean,

    // Aliases
    '-w': '--watch',
    '-c': '--config',
    '-d': '--out-dir'
  }, { argv, permissive: true })

  let opts = {}

  let configPath = args['--config']
  let entryHtml = args['--entry-html'] || args['_'][0] || ''
  let entryComponent = args['--entry-component']

  let outDir = args['--out-dir']
  let watch = args['--watch'] || dev

  let parcelOpts = {
    watch
  }

  // Set outDir only if specified.
  if (outDir) {
    parcelOpts.outDir = outDir
  }

  if (entryHtml) {
    entryHtml = path.resolve(cwd, entryHtml)
  }

  if (configPath && fs.existsSync(path.resolve(cwd, configPath))) {
    opts = _.assign({}, require(path.resolve(cwd, configPath)))
    cwd = path.dirname(configPath)
  }

  if (!opts.entryHtml && !entryHtml) {
    throw new Error('entryHtml option missing, must be passed as arg (or set "config.entryHtml").')
  }

  // Prefer cli-args over config.
  entryHtml = path.resolve(cwd, entryHtml || opts.entryHtml)

  // Automatic config resolution based on entryHtml dir.
  if (!configPath) {
    configPath = findUp.sync('parcel-u.config.js', { cwd: path.dirname(entryHtml) })
    if (fs.existsSync(configPath)) {
      opts = _.assign({}, require(path.resolve(cwd, configPath)))
    }
  }

  opts.entryHtml = entryHtml

  if (entryComponent) {
    opts.entryComponent = entryComponent
  }

  return {
    opts,
    parcelOpts
  }
}
