import _ from 'lodash'
import util from 'util'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

import { getOpts, UniversalBundler } from '..'
import arg from 'arg'

const cwd = process.cwd()

const writeFile = util.promisify(fs.writeFile)
const mkdirp = util.promisify(require('mkdirp'))

const helpMessage = chalk`
Usage:

    {dim $} {bold parcel-u export} entryHtml -u /hoge -u /fuga -u /piyo

Options:
    --help                      shows this help message
    -u, --url                   {bold required:} urls to render (Handled as array, at least one "-u" arg is required.)
    -e, --ext                   exported file extension (defaults to {bold ".html"})
    -p, --public-dir            the directory exported files will be saved (defaults to {bold "./dist/client"})
    
    
`

export default async (argv) => {
  const args = arg({
    // Args
    '--public-dir': String,
    '--ext': String,
    '--url': [String],
    '--help': Boolean,

    // Aliases
    '-p': '--public-dir',
    '-e': '--ext',
    '-u': '--url'
  }, { argv, permissive: true })

  if (args['--help']) {
    console.error(helpMessage)
    process.exit(2)
  }

  // Get opts from config or args for cli-usage.
  const { opts, parcelOpts } = getOpts(argv)

  // Defaults to client dist dir.
  const publicDir = args['--public-dir'] || './dist/client'
  const urls = args['--url'] || []
  const ext = args['--ext'] || '.html'

  if (_.isEmpty(urls)) {
    throw new Error('urls is missing, pass url as "-u" option. multiple url is allowed (eg: -u /hoge -u /fuga)')
  }

  const dir = path.resolve(cwd, publicDir)

  const bundler = new UniversalBundler(opts, parcelOpts)

  const arrayOfHtml = await bundler.render(urls)

  // TODO: Add tree results print like the one Next.js does :)
  return Promise.all(_.map(_.zip(urls, arrayOfHtml), async ([url, html]) => {
    // Treat url as relative to publicDir.
    url = url.replace(/^\//, './')
    // Add .html if no extension specified.
    if (!path.extname(url)) {
      url = `${url}${ext}`
    }
    // Create directory first (if not exists.)
    await mkdirp(path.dirname(path.resolve(dir, url)))
    // Then write file into that directory.
    return writeFile(path.resolve(dir, url), html, { encoding: 'utf8' })
  }))
}
