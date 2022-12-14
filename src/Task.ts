/**
 * Handles the execution of asynchronous effectful operations.
 *
 * See the [Task](https://package.elm-lang.org/packages/elm/core/latest/Task) Elm package.
 *
 * @since 0.5.0
 */

import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import { of } from 'rxjs'
import { Cmd } from './Cmd'

/**
 * Executes a `Task` as a `Cmd` mapping the result to a `Msg`.
 * @category utils
 * @since 0.5.0
 */
export function perform<A, Msg>(f: (a: A) => Msg): (t: T.Task<A>) => Cmd<Msg> {
  return t => of(T.map((a: A) => some(f(a)))(t))
}

/**
 * Executes a `Task` that can fail as a `Cmd` mapping the result (`Either`) to a `Msg`.
 * @category utils
 * @since 0.5.0
 */
export function attempt<E, A, Msg>(f: (e: Either<E, A>) => Msg): (task: T.Task<Either<E, A>>) => Cmd<Msg> {
  return perform(f)
}
