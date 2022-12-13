import * as assert from 'assert'
import { fold, right } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import { attempt, perform } from '../src/Task'

describe('Task', () => {
  it('perform() should "perform" at runtime a Task and give back a Cmd', done => {
    const t = T.of('foo')
    const p = perform(_ => ({ type: 'FOO' }))

    p(t).subscribe(async to => {
      const result = await to()

      assert.deepStrictEqual(result, some({ type: 'FOO' }))

      done()
    })
  })

  it('attempt() should "perform" at runtime a Task that can fail', done => {
    const te = T.of(right('foo'))
    const a = attempt(
      fold(
        _ => ({ type: 'BAR' }),
        _ => ({ type: 'FOO' })
      )
    )

    a(te).subscribe(async to => {
      const result = await to()

      assert.deepStrictEqual(result, some({ type: 'FOO' }))

      done()
    })
  })
})
