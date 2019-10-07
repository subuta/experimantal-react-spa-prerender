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

import { INITIAL_PROPS_KEY } from './config'

const isBrowser = typeof window !== 'undefined'

// Spread initialProps into props.
const withInitialProps = withProps(({ initialProps = {} }) => initialProps)

export default (App) => {
  const { getInitialProps = _.noop } = App

  if (!isBrowser) return withInitialProps(App)

  const enhance = compose(
    withState('initialProps', 'setInitialProps', () => {
      if (isBrowser && window[INITIAL_PROPS_KEY]) {
        return window[INITIAL_PROPS_KEY]
      }
      return null
    }),
    lifecycle({
      async componentDidMount () {
        const { setInitialProps } = this.props

        // Early return if initialProps already exists(passed from server).
        if (this.props.initialProps) {
          // Clear global initialProps for trigger getInitialProps at next componentDidMount call.
          delete window[INITIAL_PROPS_KEY]
          return
        }

        const initialProps = await getInitialProps({ url: location.pathname }) || {}

        // Suppress "Can't perform a React state update on an unmounted component" error.
        if (this.unmounted) return

        setInitialProps(initialProps)
      },

      componentWillUnmount () {
        this.unmounted = true
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
