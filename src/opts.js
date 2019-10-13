import path from 'path'
import fs from 'fs'
import findUp from 'find-up'
import arg from 'arg'

import _ from 'lodash'

const dev = process.env.NODE_ENV !== 'production'

export default () => {
  let cwd = process.cwd()

  const args = arg({
    // Args
    '--entry-html': String,
    '--config': String,
    '--out-dir': String,

    // Parcel Args.
    '--watch': Boolean,

    // Aliases
    '-w': '--watch',
    '-c': '--config',
    '-d': '--out-dir'
  })

  let opts = {}

  let configPath = args['--config']
  let entryHtml = args['--entry-html'] || args['_'][0] || ''

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

  if (!configPath) {
    configPath = findUp.sync('parcel-u.config.js', { cwd: path.dirname(entryHtml) })
    if (!fs.existsSync(configPath)) throw new Error('Config file must be needed with config.renderToHtml option.')
    opts = _.assign({}, require(path.resolve(cwd, configPath)))
  }

  opts.entryHtml = entryHtml

  return {
    opts,
    parcelOpts
  }
}
