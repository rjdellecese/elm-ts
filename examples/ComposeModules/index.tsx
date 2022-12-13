import * as ReactDOMClient from 'react-dom/client'

import * as DebugHtml from '../../src/Debug/Html'
import * as React from '../../src/React'

import * as App from './App'

const program = process.env.NODE_ENV === 'production' ? React.programWithFlags : DebugHtml.programWithDebuggerWithFlags

const main = program(App.init, App.update, App.view)

const element = document.getElementById('root')

if (element) {
  React.run(main({ prefix: 'String: ' }), dom => ReactDOMClient.createRoot(element).render(dom))
} else {
  throw 'Failed to find root element'
}
