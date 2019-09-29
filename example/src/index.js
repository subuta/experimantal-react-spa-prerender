import React from 'react'
import ReactDOM from 'react-dom'

import './app.pcss'

import App from './App'

const main = async () => {
  ReactDOM.render(
    <App />,
    document.getElementById('app')
  )
}

main()
