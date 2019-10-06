import _ from 'lodash'

import React from 'react'
import { renderToString } from 'react-dom/server'

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

  // Render App
  return renderToString(
    <App initialProps={ctx.state.initialProps} />
  )
}
