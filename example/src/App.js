import React from 'react'
import { hot } from 'react-hot-loader'

import styles from './App.pcss'

console.log(styles)

const App = () => {
  return (
    <h1 className={styles.title}>hello!</h1>
  )
}

export default hot(module)(App)
