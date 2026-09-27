import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './today-v3.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        const announce = () => {
          if (registration.waiting && navigator.serviceWorker.controller)
            window.dispatchEvent(
              new CustomEvent('engineer-update', {
                detail: registration.waiting,
              }),
            )
        }
        announce()
        registration.addEventListener('updatefound', () => {
          registration.installing?.addEventListener('statechange', announce)
        })
      })
      .catch(() =>
        window.dispatchEvent(new Event('engineer-offline-unavailable')),
      )
  })
}
