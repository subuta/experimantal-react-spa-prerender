import React from 'react'

import _ from 'lodash'

import {
  lifecycle,
  compose,
  withState,
  branch,
  renderComponent,
  withProps
} from 'recompose'

// Spread initialProps into props.
const withInitialProps = withProps(({ initialProps = {} }) => initialProps)

export default (App) => {
  const { getInitialProps = _.noop } = App

  const isBrowser = typeof window !== 'undefined'
  if (!isBrowser) return withInitialProps(App)

  const enhance = compose(
    withState('initialProps', 'setInitialProps', null),
    lifecycle({
      async componentDidMount () {
        const { setInitialProps } = this.props
        const initialProps = await getInitialProps() || {}
        setInitialProps(initialProps)
      }
    }),
    withInitialProps,
    branch(
      ({ initialProps }) => !initialProps,
      renderComponent(() => null),
      _.identity
    )
  )

  return enhance(App)
}
