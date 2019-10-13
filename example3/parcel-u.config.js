import React from 'react'
import { renderToString } from 'react-dom/server'

module.exports = {
  entryHtml: './src/index.html',
  renderToHtml: async ($, App, ctx) => {
    // Change title.
    $('title').text(`${ctx.url} - Rendered at Server`)

    // Inject rendered html into container.
    $('#app').html(renderToString(React.createElement(App)))

    return $.html()
  }
}
