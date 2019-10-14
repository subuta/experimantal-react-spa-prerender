const React = require('react')

const _ = require('lodash')

const { INITIAL_PROPS_KEY } = require('./config')

const isBrowser = typeof window !== 'undefined'

module.exports = (App) => {
  const { getInitialProps = _.noop } = App

  if (!isBrowser) return App

  class Component extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        initialProps: (() => {
          if (isBrowser && window[INITIAL_PROPS_KEY]) {
            return window[INITIAL_PROPS_KEY]
          }
          return null
        })()
      }
    }

    async componentDidMount () {
      // Early return if initialProps already exists(passed from server).
      if (this.state.initialProps) {
        // Clear global initialProps for trigger getInitialProps at next componentDidMount call.
        delete window[INITIAL_PROPS_KEY]
        return
      }

      const initialProps = await getInitialProps({ url: location.pathname }) || {}

      // Suppress "Can't perform a React state update on an unmounted component" error.
      if (this.unmounted) return

      this.setState({ initialProps })
    }

    componentWillUnmount () {
      this.unmounted = true
    }

    render () {
      const { initialProps } = this.state
      if (!initialProps) return null
      return (
        <App initialProps={initialProps} />
      )
    }
  }

  return Component
}

