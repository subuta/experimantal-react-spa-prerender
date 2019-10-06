import React from 'react'
import { hot } from 'react-hot-loader'

import { Helmet } from 'react-helmet'

import fetch from 'isomorphic-unfetch'

import styles from './App.pcss'

import {
  compose,
  hoistStatics,
  renderComponent
} from 'recompose'

import { resolveGetInitialProps } from '../../src/client'

import './global.pcss'

const enhance = compose(
  hot(module),
  resolveGetInitialProps
)

const App = ({ joke }) => {
  return (
    <>
      <Helmet>
        <title>{joke || 'default'}</title>
      </Helmet>

      <h1 className={styles.title}>{joke}</h1>
    </>
  )
}

App.getInitialProps = async () => {
  const jokes = await fetch(`http://api.icndb.com/jokes/2`).then((res) => res.json())
  const { joke } = jokes.value
  return { joke }
}

export default hoistStatics(renderComponent(enhance(App)))(App)
