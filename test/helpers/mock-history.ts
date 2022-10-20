import { Action, History, Listener, To } from 'history'

/**
 * Creates a mocked implementation of the `history.createBrowserHistory()` function that tracks location changes through the `log` parameter
 */
export function createMockHistory(log: string[]): () => History {
  let listener: Listener

  return () => ({
    location: {
      pathname: log.length > 0 ? log[log.length - 1] : '',
      search: '',
      state: null,
      hash: '',
      key: ''
    },

    push: (to: To): void => {
      const p = typeof to === 'string' ? to : typeof to.pathname !== 'undefined' ? to.pathname : ''
      log.push(p)

      listener({
        location: {
          pathname: p,
          search: '',
          state: null,
          hash: '',
          key: ''
        },
        action: Action.Push
      })
    },

    listen: (listener_: Listener): (() => void) => {
      listener = listener_
      return () => undefined
    },

    // These are needed by `history` types declaration
    length: log.length,
    action: Action.Push,
    replace: () => undefined,
    go: () => undefined,
    back: () => undefined,
    forward: () => undefined,
    block: () => () => undefined,
    createHref: () => ''
  })
}
