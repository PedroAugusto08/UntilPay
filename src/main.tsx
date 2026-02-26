import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './app/router'

// Ponto de entrada da aplicação: sobe o React e entrega o controle para o roteador.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="app-shell">
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)
