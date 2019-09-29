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

export default (App) => {
  const { getInitialProps = _.noop } = App

  const enhance = compose(
    withState('initialProps', 'setInitialProps', null),
    lifecycle({
      async componentDidMount () {
        const { setInitialProps } = this.props
        const initialProps = await getInitialProps() || {}
        setInitialProps(initialProps)
      }
    }),
    withProps(({ initialProps = {} }) => initialProps),
    branch(
      ({ initialProps }) => !initialProps,
      renderComponent(() => null),
      _.identity
    )
  )

  return enhance(App)
}
