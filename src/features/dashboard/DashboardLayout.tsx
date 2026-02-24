import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Home, Wallet } from 'lucide-react'
import { useLocation, useNavigate, useOutlet } from 'react-router-dom'

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

const pageVariants = {
  initial: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? -40 : 40,
  }),
}

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const outlet = useOutlet()
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const isHorizontalSwipeRef = useRef(false)
  const previousPathnameRef = useRef(location.pathname)
  const [edgePullX, setEdgePullX] = useState(0)

  const currentTabIndex = tabs.findIndex((tab) => tab.to === location.pathname)
  const previousTabIndex = tabs.findIndex((tab) => tab.to === previousPathnameRef.current)

  // Direção inteligente: avançando abas anima da direita para esquerda, e vice-versa.
  const direction: 1 | -1 =
    currentTabIndex >= 0 && previousTabIndex >= 0 && currentTabIndex < previousTabIndex ? -1 : 1

  useEffect(() => {
    previousPathnameRef.current = location.pathname
  }, [location.pathname])

  const goToTabByIndex = (index: number) => {
    if (index < 0 || index >= tabs.length) {
      return
    }

    navigate(tabs[index].to)
  }

  const hasPreviousTab = currentTabIndex > 0
  const hasNextTab = currentTabIndex >= 0 && currentTabIndex < tabs.length - 1

  const resetSwipeState = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
    isHorizontalSwipeRef.current = false
    setEdgePullX(0)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    isHorizontalSwipeRef.current = false
    setEdgePullX(0)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchStartX = touchStartXRef.current
    const touchStartY = touchStartYRef.current

    if (touchStartX === null || touchStartY === null || currentTabIndex < 0) {
      return
    }

    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const SWIPE_LOCK_THRESHOLD = 10

    // Depois que o gesto fica claramente horizontal, travamos o scroll vertical.
    if (!isHorizontalSwipeRef.current && absDeltaX > absDeltaY && absDeltaX > SWIPE_LOCK_THRESHOLD) {
      isHorizontalSwipeRef.current = true
    }

    if (isHorizontalSwipeRef.current && event.cancelable) {
      event.preventDefault()
    }

    // Se o gesto está mais vertical, desativa resistência para não brigar com o scroll.
    if (absDeltaY > absDeltaX) {
      setEdgePullX(0)
      return
    }

    const swipingBeyondLeftEdge = !hasPreviousTab && deltaX > 0
    const swipingBeyondRightEdge = !hasNextTab && deltaX < 0

    if (!swipingBeyondLeftEdge && !swipingBeyondRightEdge) {
      setEdgePullX(0)
      return
    }

    // Resistência nas bordas: desloca pouco e com amortecimento.
    const EDGE_DAMPING = 0.22
    const MAX_EDGE_PULL = 24
    const dampedOffset = deltaX * EDGE_DAMPING
    const clampedOffset = Math.max(-MAX_EDGE_PULL, Math.min(MAX_EDGE_PULL, dampedOffset))

    setEdgePullX(clampedOffset)
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchStartX = touchStartXRef.current
    const touchStartY = touchStartYRef.current

    if (touchStartX === null || touchStartY === null || currentTabIndex < 0) {
      resetSwipeState()
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    // Evita troca de aba quando o usuário está rolando verticalmente.
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      resetSwipeState()
      return
    }

    const SWIPE_THRESHOLD = 60

    // Swipe para esquerda avança para a próxima aba.
    if (deltaX <= -SWIPE_THRESHOLD) {
      goToTabByIndex(currentTabIndex + 1)
      resetSwipeState()
      return
    }

    // Swipe para direita volta para a aba anterior.
    if (deltaX >= SWIPE_THRESHOLD) {
      goToTabByIndex(currentTabIndex - 1)
      resetSwipeState()
      return
    }

    // Se não trocou de aba, volta suavemente da resistência de borda.
    resetSwipeState()
  }

  const handleTouchCancel = () => {
    resetSwipeState()
  }

  return (
    // Casca visual compartilhada de todas as telas do dashboard.
    <main className="min-h-screen bg-[#0F1115] pb-24 text-[#F3F4F6]">
      <section className="mx-auto max-w-5xl px-4 py-6">
        {/* Container estável para evitar "pulo" de layout durante a troca de telas. */}
        <div
          className="relative min-h-[calc(100vh-8.5rem)] overflow-x-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <motion.div
            // Camada da resistência de borda (não troca rota, só feedback tátil visual).
            animate={{ x: edgePullX }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.4 }}
            className="min-h-[calc(100vh-8.5rem)]"
          >
            {/* AnimatePresence coordena animação de saída + entrada entre rotas. */}
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={location.pathname}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="min-h-[calc(100vh-8.5rem)]"
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Navegação fixa para facilitar uso com uma mão (mobile first). */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#232938] bg-[#161A22]">
        <ul className="mx-auto flex h-16 max-w-5xl items-center justify-around px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.to

            return (
              <li key={tab.to} className="flex-1">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      navigate(tab.to)
                    }
                  }}
                  className="relative flex w-full flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-xs font-medium"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {/* Área fixa do ícone evita deslocamento visual entre estados. */}
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    {/* Highlight compartilhado: desliza suavemente entre as abas ativas. */}
                    {isActive && (
                      <motion.div
                        layoutId="navHighlight"
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: 'rgba(59,130,246,0.12)',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      />
                    )}

                    {/* Microinteração do ícone: escala levemente quando ativo. */}
                    <motion.div
                      animate={{ scale: isActive ? 1.08 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="relative z-10"
                      style={{ color: isActive ? '#3B82F6' : '#6B7280' }}
                    >
                      <Icon size={18} />
                    </motion.div>
                  </div>

                  <span
                    className="transition-colors duration-200"
                    style={{ color: isActive ? '#3B82F6' : '#6B7280' }}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </nav>
    </main>
  )
}
