import { getOpts, UniversalBundler } from '..'

// Get opts from config or args for cli-usage.
const { opts, parcelOpts } = getOpts()

const bundler = new UniversalBundler(opts, parcelOpts)

bundler.bundle()
