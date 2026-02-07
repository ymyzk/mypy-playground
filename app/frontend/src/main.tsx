import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/globals.css'
import App from './components/App'
import ContextLoader from './components/ContextLoader'

const AppWithContext = ContextLoader(App)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithContext />
  </StrictMode>,
)
