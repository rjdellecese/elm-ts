import * as assert from 'assert'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { Cmd, none } from '../src/Cmd'
import { Html, map, program, programWithFlags, run } from '../src/React'
import * as App from './helpers/app'
import { delayedAssert } from './helpers/utils'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean // eslint-disable-line no-var
}

const initialIsReactActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

afterAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = initialIsReactActEnvironment
})

describe('React', () => {
  describe('map()', () => {
    it('should map an Html<A> into an Html<msg>', () => {
      const log: string[] = []
      const dispatch = (msg: App.Msg) => log.push(msg.type)

      const btn01: Html<App.Msg> = dispatch => <button onClick={() => dispatch({ type: 'FOO' })}>Test</button>
      const btn02 = map<App.Msg, App.Msg>(() => ({ type: 'BAR' }))(btn01)

      btn01(dispatch).props.onClick()
      btn02(dispatch).props.onClick()

      assert.deepStrictEqual(log, ['FOO', 'BAR'])
    })
  })

  describe('program()', () => {
    it('should return the Model/Cmd/Sub/Html streams and Dispatch function for React - no subscription', async () => {
      const [teardown, renderings, renderer] = await makeReactApp()

      const { dispatch, html$ } = program(App.init, App.update, viewWithMount)

      html$.subscribe(v => renderer(v(dispatch)))

      dispatch({ type: 'FOO' })
      dispatch({ type: 'BAR' })
      dispatch({ type: 'DO-THE-THING!' })

      assert.deepStrictEqual(renderings, ['', 'foo', 'bar'])

      teardown()
    })

    it('should return the Model/Cmd/Sub/Html streams and Dispatch function for React - with subscription', async () => {
      const [teardown, renderings, renderer] = await makeReactApp()

      const subs: App.Msg[] = []
      const { sub$, html$, dispatch } = program(App.init, App.update, viewWithMount, App.subscriptions)

      html$.subscribe(v => renderer(v(dispatch)))
      sub$.subscribe(v => subs.push(v))

      dispatch({ type: 'FOO' })
      dispatch({ type: 'BAR' })
      dispatch({ type: 'SUB' })

      assert.deepStrictEqual(subs, [{ type: 'LISTEN' }])
      assert.deepStrictEqual(renderings, ['', 'foo', 'bar', 'sub'])

      teardown()
    })
  })

  describe('programWithFlags()', () => {
    it('should return a function which returns a program() with flags on `init` for React', async () => {
      const [teardown, renderings, renderer] = await makeReactApp()

      const initWithFlags = (f: string): [App.Model, Cmd<App.Msg>] => [{ x: f }, none]
      const withFlags = programWithFlags(initWithFlags, App.update, viewWithMount, App.subscriptions)
      const { dispatch, html$ } = withFlags('start!')

      html$.subscribe(v => renderer(v(dispatch)))

      assert.deepStrictEqual(renderings, ['start!'])

      teardown()
    })
  })

  describe('run()', () => {
    it('should run the React Program', async () => {
      const [teardown, renderings, renderer] = await makeReactApp()

      const p = program(App.init, App.update, view, App.subscriptions)

      run(p, renderer)

      p.dispatch({ type: 'FOO' })
      p.dispatch({ type: 'SUB' })
      p.dispatch({ type: 'BAR' })
      p.dispatch({ type: 'DO-THE-THING!' })

      return delayedAssert(() => {
        assert.deepStrictEqual(renderings, ['', 'foo', 'sub', 'listen', 'bar', 'foo'])

        teardown()
      })
    })

    it('should run the React Program - with commands in init and on component mount', async () => {
      const [teardown, renderings, renderer] = await makeReactApp()

      const p = program(App.initWithCmd, App.update, viewWithMount, App.subscriptions)

      run(p, renderer)

      // use timeout in order to better simulate a real case
      const to = setTimeout(() => {
        p.dispatch({ type: 'FOO' })
        p.dispatch({ type: 'SUB' })
        p.dispatch({ type: 'BAR' })
        p.dispatch({ type: 'DO-THE-THING!' })

        clearTimeout(to)
      }, 250)

      return delayedAssert(() => {
        assert.deepStrictEqual(renderings, ['', 'baz', 'foo', 'foo', 'sub', 'listen', 'bar', 'foo'])

        teardown()
      }, 500)
    })
  })
})

// --- Utilities
function view(model: App.Model): Html<App.Msg> {
  return dispatch => <Component value={model.x} onClick={() => dispatch({ type: 'FOO' })} />
}

function viewWithMount(model: App.Model): Html<App.Msg> {
  return dispatch => (
    <Component
      value={model.x}
      onClick={() => dispatch({ type: 'FOO' })}
      onMount={() => dispatch({ type: 'DO-THE-THING!' })}
    />
  )
}

interface ComponentProps {
  value: string
  onClick: () => void
  onMount?: () => void
}

function Component({ value, onClick, onMount }: ComponentProps): JSX.Element {
  // the component would dispatch a message on mount which will execute a command
  // in case `onMount` callback is defined
  React.useEffect(() => {
    if (typeof onMount !== 'undefined') {
      return onMount()
    }
  }, [])

  return <button onClick={onClick}>{value}</button>
}

type Contents = Array<string | null>

async function makeReactApp(): Promise<[() => void, Contents, (dom: React.ReactElement) => void]> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = await act(() => createRoot(container))

  const log: Contents = []

  return [
    () => {
      act(() => root.unmount())
      container.remove()
    },
    log,
    dom => {
      act(() => {
        root.render(dom)
      })

      log.push(container.textContent)
    }
  ]
}
