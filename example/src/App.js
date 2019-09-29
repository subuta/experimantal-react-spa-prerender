import React from 'react'
import { hot } from 'react-hot-loader'

import fetch from 'isomorphic-unfetch'

import styles from './App.pcss'

import resolveGetInitialProps from './resolveGetInitialProps'

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

export default hot(module)(resolveGetInitialProps(App))
