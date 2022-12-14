import * as A from 'fp-ts/lib/Array'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { FileSystem, fileSystemNode } from './helpers/fs'
import { Logger, loggerConsole } from './helpers/logger'
import { Program, run } from './helpers/program'

// eslint-disable-next-line no-useless-escape
const PATH_REGEXP = /(\s(?:from|module)\s['|"]fp-ts)\/lib\/([\w-\/]+['|"])/gm
const ES6_GLOB_PATTERN = 'es6/**/*.@(ts|js)'

const traverseRTE = A.traverse(RTE.ApplicativeSeq)

interface Capabilities extends FileSystem, Logger {}

type AppEff<A> = Program<Capabilities, A>

const getES6Paths: AppEff<string[]> = C => C.glob(ES6_GLOB_PATTERN)

const replacePath = (content: string): string => content.replace(PATH_REGEXP, '$1/es6/$2')

const rewritePaths =
  (file: string): AppEff<void> =>
  C =>
    pipe(
      C.debug(`Rewriting file ${file}`),
      TE.chain(() => C.readFile(file)),
      TE.map(replacePath),
      TE.chain(content => C.writeFile(file, content))
    )

const log =
  (s: string): AppEff<void> =>
  C =>
    C.log(s)

const main: AppEff<void[]> = pipe(
  getES6Paths,
  RTE.chain<Capabilities, string, string[], void[]>(files =>
    traverseRTE<string, Capabilities, string, void>(rewritePaths)(files)
  ),
  RTE.chainFirst(() => log('ES6 import paths rewritten'))
)

// --- Run the program
run(
  main({
    ...fileSystemNode,
    ...loggerConsole
  })
)
