#!/usr/bin/env node

// Implementation heavily based on these code :)
// SEE: https://github.com/zeit/arg/issues/39

// Enable modules.
require = require('esm')(module)

const arg = require('arg')
const chalk = require('chalk')
const _ = require('lodash')

const helpMessage = chalk`
Usage:

    {dim $} {bold parcel-u} <command> [options] [entryHtml]

Options:
    --help                      shows this help message
    --entry-html                entry html file to bundle.
    --entry-component           entry app component file name that might required at client.js (defaults to {bold "App.js"})
    -w, --watch                 starts the bundler in watch mode
    -c, --config                parcel-u configuration file name. (defaults to {bold "parcel-u.config.js"})
    -d, --out-dir               set the output directory. (defaults to {bold "dist"})
    
Commands:
    serve [options] [entryHtml]    starts server for universal-rendering
    build [options] [entryHtml]    bundles entryHtml / entryComponent sources for production
    export [options] [entryHtml]   export rendered html into public dir(Works like Static Site Generator).
`

const args = arg({
  '--help': Boolean
}, { permissive: true, stopAtPositional: true })

if (args['--help']) {
  console.error(helpMessage)
  process.exit(2)
}

const command = _.first(args['_'])

// Resolve default export and runs with args.
const run = (m) => require(m).default(_.tail(args['_']))

switch (command) {
  case 'serve':
    return run('./serve')
  case 'build':
    return run('./build')
  case 'export':
    return run('./export')
  default:
    throw new Error(`Unknown command passed, see "--help" for all available commands.`)
}
