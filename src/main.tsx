import './styles/base.css'

import { render } from 'preact'

import { App } from './app'
import { StoreProvider } from './store'

const root = document.querySelector('#app')
if (!root) {
  throw new Error('Startpage root element is missing')
}

render(
  <StoreProvider>
    <App />
  </StoreProvider>,
  root,
)
