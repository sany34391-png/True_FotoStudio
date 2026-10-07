import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.tsx'

try {
  const savedTheme = window.localStorage.getItem('theme')
  document.documentElement.setAttribute(
    'data-theme',
    savedTheme === 'light' ? 'light' : 'dark',
  )
} catch {
  document.documentElement.setAttribute('data-theme', 'dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
