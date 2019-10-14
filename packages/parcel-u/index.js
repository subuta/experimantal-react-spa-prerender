// TODO: Handle old node.js runtime by transpilation.
// SEE: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/index.js
// // Node 8 supports native async functions - no need to use compiled code!
// module.exports = parseInt(process.versions.node, 10) < 8
//   ? require('./lib/server')
//   : require('./src/server')

module.exports = require('./src')
