import React from 'react'

import _ from 'lodash'

import { Helmet } from 'react-helmet'

import fetch from 'isomorphic-unfetch'

import styles from './joke.pcss'

import {
  compose,
  hoistStatics,
  renderComponent
} from 'recompose'

import { resolveGetInitialProps } from '../../../../packages/parcel-u/src/client'

const enhance = compose(
  resolveGetInitialProps
)

const Joke = ({ initialProps }) => {
  const { joke } = initialProps || {}

  return (
    <>
      <Helmet>
        <title>{joke || 'default'}</title>
      </Helmet>

      <h1 className={styles.title}>{joke}</h1>
    </>
  )
}

let cache = {}

const cachedFetch = async (url) => {
  if (!cache[url]) {
    cache[url] = await fetch(url).then((res) => res.json())
  }
  return cache[url]
}

Joke.getInitialProps = async ({ url }) => {
  const matched = url.match(/joke\/(\d+)/)

  const id = matched ? Number(matched[1]) : null
  if (!id || _.isNaN(id)) {
    throw new Error('No id found.')
  }

  const jokes = await cachedFetch(`http://api.icndb.com/jokes/${id}`)
  const { joke } = jokes.value
  return { joke }
}

export default hoistStatics(renderComponent(enhance(Joke)))(Joke)
