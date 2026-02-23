import { BarChart3, Home, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

// Configuração simples das abas do menu inferior.
const tabs = [
  {
    to: '/dashboard/overview',
    label: 'Dashboard',
    icon: Home,
  },
  {
    to: '/dashboard/cycle',
    label: 'Operações',
    icon: Wallet,
  },
  {
    to: '/dashboard/history',
    label: 'Histórico',
    icon: BarChart3,
  },
]

export function DashboardLayout() {
  return (
    // Casca visual compartilhada de todas as telas do dashboard.
    <main className="min-h-screen bg-[#0F1115] pb-24 text-[#F3F4F6]">
      <section className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </section>

      {/* Navegação fixa para facilitar uso com uma mão (mobile first). */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#232938] bg-[#161A22]">
        <ul className="mx-auto flex h-16 max-w-5xl items-center justify-around px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon

            return (
              <li key={tab.to} className="flex-1">
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `relative flex w-full flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
                      isActive ? 'text-[#3B82F6]' : 'text-[#6B7280]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -top-[11px] h-0.5 w-10 rounded bg-[#3B82F6]" />}
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </main>
  )
}
