import React from 'react'
import { hot } from 'react-hot-loader'

import { Switch, Route, Link } from 'react-router-dom'

import { compose } from 'recompose'

import Joke from './routes/joke'

import './global.pcss'

const enhance = compose(
  hot(module)
)

export default enhance(({ initialProps }) => {
  return (
    <>
      <header>
        <Link to='/joke/1'>/joke/1</Link>
        <Link to='/joke/2'>/joke/2</Link>
        <Link to='/joke/3'>/joke/3</Link>
      </header>

      <Switch>
        {/* Separate Route component for force-re-mount (only meaningful for demo purpose) */}
        <Route exact path='/joke/1' render={() => <Joke key={1} initialProps={initialProps} />} />
        <Route exact path='/joke/2' render={() => <Joke key={2} initialProps={initialProps} />} />
        <Route exact path='/joke/3' render={() => <Joke key={3} initialProps={initialProps} />} />
      </Switch>
    </>
  )
})
