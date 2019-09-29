import 'loud-rejection/register'
import exitHook from 'async-exit-hook'

import _ from 'lodash'

import Koa from 'koa'

import koaBody from 'koa-body'
import logger from 'koa-logger'

import path from 'path'

import { source } from 'common-tags'

import serve from 'koa-static'

import React from 'react'
import { renderToString } from 'react-dom/server'

import App from '../example/src/App'

import ssrPrepass from 'react-ssr-prepass'

import { Provider, Subscribe, Container } from 'unstated'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

class InitialPropsContainer extends Container {
  constructor (initialProps) {
    super()
    this.state = {
      initialProps: initialProps || null
    }
  }

  setInitialProps (initialProps) {
    this.setState({ initialProps })
  }
}

const ROOT_DIR = path.resolve(__dirname, '../')
const DIST_DIR = path.resolve(ROOT_DIR, './dist')

const app = new Koa()

app.use(serve(DIST_DIR))

app.use(logger())

// Parse body
app.use(koaBody())

app.use(async (ctx, next) => {
  if (ctx.url !== '/') return

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

  const initialPropsContainer = new InitialPropsContainer(ctx.state.initialProps)

  // Render App
  const content = renderToString(
    <Provider inject={[initialPropsContainer]}>
      <Subscribe to={[InitialPropsContainer]}>
        {ipc => {
          const initialProps = ipc.state.initialProps || {}
          return (
            <App initialProps={initialProps} />
          )
        }}
      </Subscribe>
    </Provider>
  )

  ctx.body = source`
    <html>
      <link rel="stylesheet" href="/index.css"><body>
        ${content}
      </body>
    </html>
  `

  return next()
})

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})

exitHook(async (cb) => {
  console.log('Goodbye.\r\n')
  cb()
})
