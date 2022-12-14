/**
 * Defines `Cmd`s as streams of asynchronous operations which can not fail and that can optionally carry a message.
 *
 * See the [Platform.Cmd](https://package.elm-lang.org/packages/elm/core/latest/Platform-Cmd) Elm package.
 *
 * @since 0.5.0
 */

import * as O from 'fp-ts/lib/Option'
import type { Option } from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import type { Task } from 'fp-ts/lib/Task'
import { EMPTY, Observable, merge, of as RxOf } from 'rxjs'
import { map as RxMap } from 'rxjs/operators'

/**
 * @category model
 * @since 0.5.0
 */
export type Cmd<Msg> = Observable<Task<Option<Msg>>>

/**
 * Creates a new `Cmd` that carries the provided `Msg`.
 * @category Applicative
 * @since 0.5.0
 */
export function of<Msg>(m: Msg): Cmd<Msg> {
  return RxOf(T.of(O.some(m)))
}

/**
 * Maps the carried `Msg` of a `Cmd` into another `Msg`.
 * @category Functor
 * @since 0.5.0
 */
export function map<A, Msg>(f: (a: A) => Msg): (cmd: Cmd<A>) => Cmd<Msg> {
  return cmd => cmd.pipe(RxMap(T.map(O.map(f))))
}

/**
 * Batches the execution of a list of commands.
 * @category utils
 * @since 0.5.0
 */
export function batch<Msg>(arr: Array<Cmd<Msg>>): Cmd<Msg> {
  return merge(...arr)
}

/**
 * A `none` command is an empty stream.
 * @category constructors
 * @since 0.5.0
 */
export const none: Cmd<never> = EMPTY
