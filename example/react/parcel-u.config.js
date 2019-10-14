const _ = require('lodash')

const React = require('react')
const { StaticRouter } = require('react-router')
const { Helmet } = require('react-helmet')

const { asyncRenderToString } = require('parcel-u-react/server')

module.exports = {
  entryHtml: './src/index.html',
  renderToHtml: async ($, App, ctx) => {
    if (!_.startsWith(ctx.url, '/joke')) return

    // Render using parcel-u-react helper.
    const { head, app } = await asyncRenderToString(
      App,
      {
        url: ctx.url
      },
      { Helmet, StaticRouter }
    )

    // Inject rendered head.
    $('head').append(head)

    // Inject rendered html into container.
    $('#app').html(app)

    return $.html()
  }
}
