import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'
import c2k from 'koa-connect'

import chalk from 'chalk'
import arg from 'arg'

import { getOpts, UniversalBundler } from '..'

const port = parseInt(process.env.PORT, 10) || 3000

const helpMessage = chalk`
Usage:

    {dim $} {bold parcel-u serve} entryHtml

Options:
    --help                      shows this help message
    
    
`

export default (argv) => {
  const args = arg({
    // Args
    '--help': Boolean,

    // Aliases
  }, { argv, permissive: true })

  if (args['--help']) {
    console.error(helpMessage)
    process.exit(2)
  }

  // Get opts from config or args for cli-usage.
  const { opts, parcelOpts } = getOpts(argv)

  const bundler = new UniversalBundler(opts, parcelOpts)

  const app = new Koa()

  app.use(logger())

  // Parse body
  app.use(koaBody())

  const bm = c2k(bundler.middleware())

  app.use((ctx, next) => {
    // Fix for parcel middleware.
    ctx.status = 200
    return bm(ctx, next)
  })

  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`)
  })

  exitHook(async (cb) => {
    console.log('Goodbye.\r\n')
    await bundler.stop()
    cb()
  })
}
