import _ from 'lodash'

import React from 'react'
import {
  renderToString,
  renderToStaticMarkup
} from 'react-dom/server'

import { INITIAL_PROPS_KEY } from './config'

import ssrPrepass from 'react-ssr-prepass'

export default async (App, ctx) => {
  // Pre-render App for data fetching.
  await ssrPrepass(
    <App />,
    // Custom visitor function of react-ssr-prepass for allowing next.js style data fetching.
    (element, instance) => {
      if (_.get(element, 'type.getInitialProps')) {
        return element.type.getInitialProps(ctx, { hoge: 'fuga' }).then((initialProps) => {
          ctx.state.initialProps = initialProps
        })
      }
    }
  )

  const app = renderToString(
    <App initialProps={ctx.state.initialProps} />
  )

  // Render App
  return renderToStaticMarkup(
    <html>
      <head>
        <link rel='stylesheet' href='/client.css' />
      </head>
      <body>
        <div id='app' dangerouslySetInnerHTML={{ __html: app }} />

        <script dangerouslySetInnerHTML={{ __html: `window.${INITIAL_PROPS_KEY} = ${JSON.stringify(ctx.state.initialProps)};` }} />
        <script src='/client.js' />
      </body>
    </html>
  )
}
