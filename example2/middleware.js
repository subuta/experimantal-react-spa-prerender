import React from 'react'
import { renderToString } from 'react-dom/server'

export default (ctx, next) => {
  if (ctx.url === '/react') {
    ctx.body = renderToString((
      <h1>hello world from server</h1>
    ))
    return
  }
  return next()
}
