import { Navigate, createHashRouter } from 'react-router-dom'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { CurrentCyclePage } from '../features/dashboard/CurrentCyclePage'
import { DashboardLayout } from '../features/dashboard/DashboardLayout'
import { HistoryPage } from '../features/dashboard/HistoryPage'
import { OverviewPage } from '../features/dashboard/OverviewPage'

// Mapa principal de rotas da aplicação.
// Hash router para evitar tela branca em hospedagem estática (ex.: GitHub Pages).
export const router = createHashRouter([
  {
    // Entrada do usuário: onboarding em etapas.
    path: '/',
    element: <OnboardingPage />,
  },
  {
    // Área logada com navegação inferior e páginas internas.
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        // Ao entrar em /dashboard, redireciona para a visão principal.
        index: true,
        element: <Navigate to="overview" replace />,
      },
      {
        path: 'overview',
        element: <OverviewPage />,
      },
      {
        path: 'cycle',
        element: <CurrentCyclePage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
    ],
  },
])  
