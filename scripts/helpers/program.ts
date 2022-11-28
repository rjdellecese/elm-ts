import chalk from 'chalk'
import { fold } from 'fp-ts/lib/Either'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as TE from 'fp-ts/lib/TaskEither'

export type Eff<A> = TE.TaskEither<string, A>

export type Program<C, A> = RTE.ReaderTaskEither<C, string, A>

export function run<A>(eff: Eff<A>): void {
  eff()
    .then(
      fold(
        e => {
          throw e
        },
        _ => {
          process.exitCode = 0
        }
      )
    )
    .catch(e => {
      console.error(chalk.red('[ERROR]', e))

      process.exitCode = 1
    })
}
