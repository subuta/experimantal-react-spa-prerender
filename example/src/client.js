import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

const main = () => {
  ReactDOM.hydrate(
    <App />,
    document.querySelector('#app')
  )
}

main()
