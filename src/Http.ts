/**
 * Makes http calls to remote resources as `Cmd`s.
 *
 * See [Http](https://package.elm-lang.org/packages/elm/http/latest/Http) Elm package.
 *
 * @since 0.5.0
 */

import * as Arr from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as Rec from 'fp-ts/lib/Record'
import { last } from 'fp-ts/lib/Semigroup'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import * as Json from 'fp-ts/lib/Json'
import { pipe, flow } from 'fp-ts/lib/function'
import { Observable, OperatorFunction, of, lastValueFrom } from 'rxjs'
import { AjaxError, AjaxResponse, AjaxTimeoutError, ajax, AjaxConfig } from 'rxjs/ajax'
import { catchError, map } from 'rxjs/operators'
import { Cmd } from './Cmd'
import { Decoder } from './Decode'

// --- Aliases for docs
import Option = O.Option
import Either = E.Either
import TaskEither = TE.TaskEither
// ---

/**
 * @category model
 * @since 0.5.0
 */
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * @category model
 * @since 0.6.0
 */
export type Headers = Record<string, string>

/**
 * @category model
 * @since 0.5.0
 */
export interface Request<A> {
  expect: Decoder<A>
  url: string
  method: Method
  headers: Headers
  body?: unknown
  timeout: Option<number>
  withCredentials: boolean
}

/**
 * @category model
 * @since 0.5.0
 */
export interface Response<Body> {
  url: string
  status: {
    code: number
    message: string
  }
  headers: Headers
  body: Body
}

/**
 * @category model
 * @since 0.5.0
 */
export type HttpError =
  | { readonly _tag: 'BadUrl'; readonly value: string }
  | { readonly _tag: 'Timeout' }
  | { readonly _tag: 'NetworkError'; readonly value: string }
  | { readonly _tag: 'BadStatus'; readonly response: Response<string> }
  | { readonly _tag: 'BadPayload'; readonly value: string; readonly response: Response<string> }

/**
 * @category destructors
 * @since 0.5.0
 */
export function toTask<A>(req: Request<A>): TaskEither<HttpError, A> {
  return () => lastValueFrom(xhrOnlyBody(req))
}

/**
 * Executes as `Cmd` the provided call to remote resource, mapping the result to a `Msg`.
 *
 * Derived from [`sendBy`](#sendBy).
 *
 * @since 0.5.0
 */
export function send<A, Msg>(f: (e: Either<HttpError, A>) => Msg): (req: Request<A>) => Cmd<Msg> {
  return sendBy(
    flow(
      E.map(r => r.body),
      f
    )
  )
}

/**
 * Executes as `Cmd` the provided call to remote resource, mapping the full Response to a `Msg`.
 *
 * @since 0.6.0
 */
export function sendBy<A, Msg>(f: (e: Either<HttpError, Response<A>>) => Msg): (req: Request<A>) => Cmd<Msg> {
  return flow(xhr, toMsg(f))
}

/**
 * @category constructors
 * @since 0.5.0
 */
export function get<A>(url: string, decoder: Decoder<A>): Request<A> {
  return {
    method: 'GET',
    headers: {},
    url,
    body: undefined,
    expect: decoder,
    timeout: O.none,
    withCredentials: false
  }
}

/**
 * @category constructors
 * @since 0.5.0
 */
export function post<A>(url: string, body: unknown, decoder: Decoder<A>): Request<A> {
  return {
    method: 'POST',
    headers: {},
    url,
    body,
    expect: decoder,
    timeout: O.none,
    withCredentials: false
  }
}

// -----------
// --- Helpers
// -----------
type Result<A> = Either<HttpError, A>
type ResultResponse<A> = Result<Response<A>>
type TO<A> = T.Task<Option<A>>

const fromStrArr = Rec.fromFoldableMap(last<string>(), Arr.Foldable)

const xhrOnlyBody = flow(xhr, extractBody())

function toMsg<A, Msg>(project: (e: Result<A>) => Msg): OperatorFunction<Result<A>, TO<Msg>> {
  return map(flow(project, O.some, T.of))
}

function extractBody<A>(): OperatorFunction<ResultResponse<A>, Result<A>> {
  return map(E.map(response => response.body))
}

type ResultResponse$<A> = Observable<ResultResponse<A>>

function xhr<A>(req: Request<A>): ResultResponse$<A> {
  return pipe(
    ajax<string>(toXHRRequest(req)),
    map(flow(toResponse, decodeWith(req.expect))),
    catchError((e: unknown): ResultResponse$<A> => of(E.left(toHttpError(req, e))))
  )
}

function toXHRRequest<A>(req: Request<A>): AjaxConfig {
  return {
    ...req,
    timeout: O.getOrElse(() => 0)(req.timeout),
    async: true,
    responseType: 'text',
    crossDomain: false
  }
}

function toResponse(resp: AjaxResponse<string>): Response<string> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: resp.request.url!, // url in Request is always defined
    status: { code: resp.status, message: resp.xhr.statusText },
    headers: toResponseHeaders(resp.xhr),
    body: typeof resp.response === 'string' && resp.response.length > 0 ? resp.response : '{}'
  }
}

function decodeWith<A>(decoder: Decoder<A>): (response: Response<string>) => ResultResponse<A> {
  return response =>
    pipe(
      Json.parse(response.body),
      // By spec parsing json can only throw `SyntaxError`
      E.mapLeft(e => (e as SyntaxError).message),
      E.chain(decoder),
      E.bimap(
        value => ({ _tag: 'BadPayload', value, response }),
        body => ({ ...response, body })
      )
    )
}

function toHttpError<A>(req: Request<A>, e: unknown): HttpError {
  if (e instanceof AjaxTimeoutError) {
    return { _tag: 'Timeout' }
  }

  if (e instanceof AjaxError && e.status === 404) {
    return { _tag: 'BadUrl', value: req.url }
  }

  if (e instanceof AjaxError && e.status !== 0) {
    return {
      _tag: 'BadStatus',
      response: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        url: e.request.url!, // url in Request is always defined
        status: { code: e.status, message: e.xhr.statusText },
        headers: toResponseHeaders(e.xhr),
        body: e.response
      }
    }
  }

  return { _tag: 'NetworkError', value: e instanceof Error ? e.message : '' }
}

function toResponseHeaders(xhr: XMLHttpRequest): Headers {
  return pipe(
    xhr.getAllResponseHeaders(),
    O.fromPredicate((x: string) => x.length > 0),
    O.map(hs => hs.trim().split(/[\r\n]+/)),
    O.map(Arr.map(line => line.split(': '))),
    O.map(kvs => fromStrArr(kvs, ([k, v]) => [k, v])),
    O.getOrElse(() => ({}))
  )
}
