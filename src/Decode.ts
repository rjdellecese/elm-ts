/**
 * Defines a `Decoder`, namely a function that receives an `unknown` value and tries to decodes it in an `A` value.
 *
 * It returns an `Either` with a `string` as `Left` when decoding fails or an `A` as `Right` when decoding succeeds.
 *
 * @since 0.5.0
 */

import { Alternative1 } from 'fp-ts/lib/Alternative'
import * as Apply from 'fp-ts/lib/Apply'
import * as Monad from 'fp-ts/lib/Monad'
import * as Chain from 'fp-ts/lib/Chain'
import * as Compactable from 'fp-ts/lib/Compactable'
import * as E from 'fp-ts/lib/Either'
import * as RE from 'fp-ts/lib/ReaderEither'
import * as P from 'fp-ts/lib/pipeable'

// --- Aliases for docs
import ReaderEither = RE.ReaderEither

/**
 * @category instances
 * @since 0.5.0
 */
export const URI = 'elm-ts/Decoder'

/**
 * @category instances
 * @since 0.5.0
 */
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Decoder<A>
  }
}

/**
 * @category model
 * @since 0.5.0
 */
export type Decoder<A> = ReaderEither<unknown, string, A>

/**
 * @category constructors
 * @since 0.5.0
 */
export const left: <A = never>(e: string) => Decoder<A> = RE.left

/**
 * @category constructors
 * @since 0.5.0
 */
export const right: <A>(a: A) => Decoder<A> = RE.of

/**
 * @category combinators
 * @since 0.5.0
 */
export const orElse: <A>(f: (e: string) => Decoder<A>) => (ma: Decoder<A>) => Decoder<A> = RE.orElse

// --- Non-pipeables
const _map = RE.Functor.map
const _ap = RE.Applicative.ap
const _chain = RE.Monad.chain
const _alt = RE.Alt.alt

/**
 * @category instances
 * @since 0.5.0
 */
export const decoder: Monad.Monad1<URI> & Alternative1<URI> = {
  URI,
  map: _map,
  of: right,
  ap: _ap,
  chain: _chain,
  alt: _alt,
  zero: () => () => E.left('zero')
}

// --- More pipeables

/**
 * @category Apply
 * @since 0.5.0
 */
export const ap = P.ap(decoder)

/**
 * @category Apply
 * @since 0.5.0
 */
export const apFirst = Apply.apFirst(decoder)

/**
 * @category Apply
 * @since 0.5.0
 */
export const apSecond = Apply.apSecond(decoder)

/**
 * @category Monad
 * @since 0.5.0
 */
export const chain = P.chain(decoder)

/**
 * @category Monad
 * @since 0.5.0
 */
export const chainFirst = Chain.chainFirst(decoder)

/**
 * @category Monad
 * @since 0.5.0
 */
export const flatten = Compactable.compact

/**
 * @category Functor
 * @since 0.5.0
 */
export const map = P.map(decoder)

/**
 * @category Alt
 * @since 0.5.0
 */
export const alt = P.alt(decoder)
