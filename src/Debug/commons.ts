/**
 * Common utilities and type definitions for the `Debug` module.
 *
 * @since 0.5.0
 */
import { IO, chain, map } from 'fp-ts/lib/IO'
import { fold } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import { BehaviorSubject, Observable } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { Cmd, none } from '../Cmd'
import { Dispatch } from '../Platform'
import { consoleDebugger } from './console'
import { getConnection, reduxDevToolDebugger } from './redux-devtool'

/**
 * @category model
 * @since 0.5.0
 */
export type Global = typeof window

/**
 * @category model
 * @since 0.5.0
 */
export type DebugData<Model, Msg> = [DebugAction<Msg>, Model]

/**
 * @category model
 * @since 0.5.0
 */
export type DebugAction<Msg> = DebugInit | DebugMsg<Msg>

/**
 * @category model
 * @since 0.5.0
 */
export interface DebugInit {
  type: 'INIT'
}
/**
 * Creates a `DebugInit`
 * @category constructos
 * @since 0.5.0
 */
export const debugInit = (): DebugInit => ({ type: 'INIT' })

/**
 * @category model
 * @since 0.5.0
 */
export interface DebugMsg<Msg> {
  type: 'MESSAGE'
  payload: Msg
}
/**
 * Creates a `DebugMsg`
 * @category constructors
 * @since 0.5.0
 */
export const debugMsg = <Msg>(payload: Msg): DebugMsg<Msg> => ({ type: 'MESSAGE', payload })

/**
 * Extends `Msg` with a special kind of message from Debugger
 * @category model
 * @since 0.5.0
 */
export type MsgWithDebug<Model, Msg> =
  | Msg
  | { type: '__DebugUpdateModel__'; payload: Model }
  | { type: '__DebugApplyMsg__'; payload: Msg }

/**
 * Defines a generic debugging function
 * @category model
 * @since 0.5.0
 */
export interface Debug<Model, Msg> {
  (data: DebugData<Model, Msg>): void
}

/**
 * Defines a generic `Debugger`
 * @category model
 * @since 0.5.4
 */
export interface Debugger<Model, Msg> {
  (d: DebuggerR<Model, Msg>): {
    debug: Debug<Model, Msg>
    stop: () => void
  }
}

/**
 * Defines the dependencies for a `Debugger` function.
 * @category model
 * @since 0.5.0
 */
export interface DebuggerR<Model, Msg> {
  init: Model
  debug$: BehaviorSubject<DebugData<Model, Msg>>
  dispatch: Dispatch<MsgWithDebug<Model, Msg>>
}

/**
 * Adds debugging capability to the provided `update` function.
 *
 * It tracks through the `debug$` stream every `Message` dispatched and resulting `Model` update.
 *
 * It also lets directly updating the application's state with a special `Message` of type:
 *
 * ```ts
 * {
 *   type: '__DebugUpdateModel__'
 *   payload: Model
 * }
 * ```
 *
 * or applying a message with:
 * ```ts
 * {
 *   type: '__DebugApplyMsg__';
 *   payload: Msg
 * }
 * ```
 * @category utils
 * @since 0.5.3
 */
export function updateWithDebug<Model, Msg>(
  debug$: BehaviorSubject<DebugData<Model, Msg>>,
  update: (msg: Msg, model: Model) => [Model, Cmd<Msg>]
): (msg: MsgWithDebug<Model, Msg>, model: Model) => [Model, Cmd<Msg>] {
  return (msg, model) => {
    if (msg instanceof Object && 'type' in msg) {
      switch (msg.type) {
        case '__DebugUpdateModel__':
          return [msg.payload, none]

        case '__DebugApplyMsg__':
          return [update(msg.payload, model)[0], none]
      }
    }

    const result = update(msg, model)

    debug$.next([debugMsg(msg), result[0]])

    return result
  }
}

/**
 * Checks which type of debugger can be used (standard `console` or _Redux DevTool Extension_) based on provided `window` and prepares the subscription to the "debug" stream
 *
 * **Warning:** this function **SHOULD** be considered as an internal method; using it in your application **SHOULD** be avoided.
 * @category utils
 * @since 0.5.4
 */
export function runDebugger<Model, Msg>(
  win: Global,
  stop$: Observable<unknown>
): (deps: DebuggerR<Model, Msg>) => IO<void> {
  return deps =>
    pipe(
      getConnection<Model, Msg>(win),
      map(fold(() => consoleDebugger<Model, Msg>(), reduxDevToolDebugger)),
      chain(Debugger => () => {
        const { debug, stop } = Debugger(deps)

        deps.debug$.pipe(takeUntil(stop$)).subscribe({
          next: debug,
          complete: stop
        })
      })
    )
}
