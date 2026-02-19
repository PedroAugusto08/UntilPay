import { createBrowserRouter } from 'react-router-dom'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <OnboardingPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
])
