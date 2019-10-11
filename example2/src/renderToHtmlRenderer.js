import React from 'react'
import { renderToString } from 'react-dom/server'

import cheerio from 'cheerio'

let $ = null

export default (html, App) => {
  $ = cheerio.load(html)
  return (ctx, next) => {
    $('#app').html(renderToString(App))
    ctx.body = $.html()
    return
  }
}
