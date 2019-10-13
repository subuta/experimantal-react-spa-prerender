import chalk from 'chalk'

import { getOpts, UniversalBundler } from '..'
import arg from 'arg'

const helpMessage = chalk`
Usage:

    {dim $} {bold parcel-u build} entryHtml

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

  bundler.bundle()
}
