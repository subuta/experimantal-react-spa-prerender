import React from 'react'
import { hot } from 'react-hot-loader'

import { Helmet } from 'react-helmet'

export default hot(module)(() => {
  return (
    <>
      <Helmet>
        <title>rendered by react-helmet</title>
      </Helmet>

      <h1>hello world</h1>
    </>
  )
})
