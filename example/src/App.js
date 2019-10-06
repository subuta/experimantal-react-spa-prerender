import React from 'react'
import { hot } from 'react-hot-loader'

import fetch from 'isomorphic-unfetch'

import styles from './App.pcss'

import { resolveGetInitialProps } from '../../src'

import {
  compose,
  hoistStatics,
  renderComponent
} from 'recompose'

const App = ({ joke }) => {
  return (
    <h1 className={styles.title}>{joke}</h1>
  )
}

App.getInitialProps = async () => {
  const jokes = await fetch(`http://api.icndb.com/jokes/2`).then((res) => res.json())
  const { joke } = jokes.value
  return { joke }
}

const enhance = compose(
  hot(module),
  resolveGetInitialProps
)

export default hoistStatics(renderComponent(enhance(App)))(App)
