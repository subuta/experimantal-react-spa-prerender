import React from 'react'
import ReactDOM from 'react-dom'

import './global.pcss'

const main = () => {
  const $app = document.querySelector('#app')

  let render = ReactDOM.render

  // Switch to hydrate SSR Enabled.
  if ($app.hasChildNodes()) {
    render = ReactDOM.hydrate
  }

  render(
    <h1>Hello world from client</h1>,
    document.querySelector('#app')
  )
}

main()
