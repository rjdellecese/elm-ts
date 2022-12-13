import { createRoot } from 'react-dom/client'
import { programWithDebugger } from '../src/Debug/Html'
import * as React from '../src/React'
import * as component from './Counter'

const program = process.env.NODE_ENV === 'production' ? React.program : programWithDebugger

const main = program(component.init, component.update, component.view)

const element = document.getElementById('app')

if (element) {
  React.run(main, dom => createRoot(element).render(dom))
} else {
  throw 'Failed to find app element'
}
