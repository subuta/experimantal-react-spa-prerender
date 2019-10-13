import React from 'react'
import { renderToString } from 'react-dom/server'

module.exports = {
  entryHtml: './src/index.html',
  renderToHtml: async ($, App, ctx) => {
    console.log(ctx.url)

    // Change title.
    $('title').text('Rendered at Server')

    // Inject rendered html into container.
    $('#app').html(renderToString(React.createElement(App)))

    return $.html()
  }
}
