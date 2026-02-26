import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './app/router'

// Ponto de entrada da aplicação: sobe o React e entrega o controle para o roteador.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="app-shell">
      {/* Camada dinâmica de fundo: um pouco mais perceptível, ainda elegante e discreta. */}
      <div className="app-background-layer" aria-hidden="true">
        <div className="app-background-orb app-background-orb-primary animate-floatOne" />
        <div className="app-background-orb app-background-orb-secondary animate-floatTwo" />
      </div>

      {/* Conteúdo da aplicação acima do fundo animado. */}
      <div className="app-content-layer">
        <RouterProvider router={router} />
      </div>
    </div>
  </StrictMode>,
)
