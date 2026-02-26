import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Car, Ellipsis, Film, GraduationCap, HeartPulse, House, PiggyBank, Receipt, Trash2, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDashboardData } from './useDashboardData'
import {
  currencyFormatter,
  formatThousandsInput,
  getRiskLevelByDailyBudget,
  parseThousandsInput,
} from './dashboardUtils'
import { EmptyState } from './EmptyState'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../utils/expenseCategories'

const cardClass = 'rounded-2xl border border-[#232938] bg-[#161A22] p-6'

const riskLabels = {
  safe: 'Seguro',
  warning: 'Atenção',
  danger: 'Alto',
} as const

const categoryIconMap: Record<ExpenseCategory, LucideIcon> = {
  Alimentação: UtensilsCrossed,
  Transporte: Car,
  Moradia: House,
  Lazer: Film,
  Saúde: HeartPulse,
  Educação: GraduationCap,
  Outros: Ellipsis,
}

function formatUTCDateKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateKeyFromISO(dateISO: string): string {
  const dateMatch = dateISO.match(/^(\d{4}-\d{2}-\d{2})/)

  if (dateMatch) {
    return dateMatch[1]
  }

  const parsedDate = new Date(dateISO)
  if (Number.isNaN(parsedDate.getTime())) {
    return formatUTCDateKey(new Date())
  }

  return formatUTCDateKey(parsedDate)
}

function formatGroupDateLabel(dateKey: string): string {
  const todayKey = formatUTCDateKey(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  const yesterdayKey = formatUTCDateKey(yesterdayDate)

  if (dateKey === todayKey) {
    return 'Hoje'
  }

  if (dateKey === yesterdayKey) {
    return 'Ontem'
  }

  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1))

  return utcDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function normalizeCategory(category: string | undefined): ExpenseCategory {
  if (category && EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    return category as ExpenseCategory
  }

  return 'Outros'
}

type SwipeExpenseItemProps = {
  expense: {
    id: string
    amount: number
    category: ExpenseCategory
    date: string
  }
  categoryIcon: LucideIcon
  onDelete: (expenseId: string) => void
  index: number
}

function SwipeExpenseItem({ expense, categoryIcon: CategoryIcon, onDelete, index }: SwipeExpenseItemProps) {
  const ACTION_WIDTH_PX = 124
  const MAX_SWIPE_PX = ACTION_WIDTH_PX
  const OPEN_THRESHOLD_PX = 72

  const [translateX, setTranslateX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const startOffsetRef = useRef(0)
  const isHorizontalRef = useRef(false)

  const expenseDateText = new Date(expense.date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const revealProgress = Math.min(Math.abs(translateX) / MAX_SWIPE_PX, 1)

  const resetTouchState = () => {
    startXRef.current = null
    startYRef.current = null
    startOffsetRef.current = 0
    isHorizontalRef.current = false
    setIsDragging(false)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (isDeleting) {
      return
    }

    const touch = event.touches[0]
    startXRef.current = touch.clientX
    startYRef.current = touch.clientY
    startOffsetRef.current = isOpen ? -MAX_SWIPE_PX : 0
    isHorizontalRef.current = false
    setIsDragging(true)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()

    const startX = startXRef.current
    const startY = startYRef.current

    if (startX === null || startY === null || isDeleting) {
      return
    }

    const touch = event.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (!isHorizontalRef.current && absDeltaX > absDeltaY && absDeltaX > 8) {
      isHorizontalRef.current = true
    }

    if (!isHorizontalRef.current) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    const rawNextOffset = startOffsetRef.current + deltaX
    const clampedOffset = Math.max(-MAX_SWIPE_PX, Math.min(0, rawNextOffset))
    setTranslateX(clampedOffset)
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (isDeleting) {
      resetTouchState()
      return
    }

    if (!isHorizontalRef.current) {
      setTranslateX(isOpen ? -MAX_SWIPE_PX : 0)
      resetTouchState()
      return
    }

    const shouldOpen = translateX <= -OPEN_THRESHOLD_PX
    setIsOpen(shouldOpen)
    setTranslateX(shouldOpen ? -MAX_SWIPE_PX : 0)
    resetTouchState()
  }

  const handleDelete = () => {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)
    setTimeout(() => {
      onDelete(expense.id)
    }, 220)
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={isDeleting ? { opacity: 0, y: -6, height: 0 } : { opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.22, ease: 'easeOut', delay: isDeleting ? 0 : index * 0.02 }}
      className="overflow-hidden"
    >
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="absolute right-0 inset-y-0 z-0 overflow-hidden rounded-xl border border-[#232938] bg-rose-600 transition-opacity duration-200 ease-out"
          style={{ width: ACTION_WIDTH_PX, opacity: revealProgress }}
        >
          <button
            type="button"
            onClick={handleDelete}
            className={`inline-flex h-full w-full items-center justify-center gap-2 px-3 text-sm font-medium leading-none text-white transition-opacity duration-200 ${
              isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-label={`Excluir gasto de ${expense.category}`}
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>

        <div
          className="relative z-10 rounded-xl border border-[#232938] bg-[#0F1115] p-4 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={() => {
            if (isOpen && !isDragging) {
              setIsOpen(false)
              setTranslateX(0)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400">
                <CategoryIcon size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-[#F3F4F6]">{expense.category}</p>
                <p className="text-xs text-neutral-400">{expenseDateText}</p>
              </div>
            </div>

            <p className="text-right text-sm font-semibold text-[#F3F4F6]">R$ {expense.amount.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

export function CurrentCyclePage() {
  const {
    goalAmount,
    longTermGoal,
    longTermGoalPercentage,
    expenses,
    nextSalaryAmount,
    projection,
    hasMissingData,
    removeExpense,
    setGoal,
    setLongTermGoal,
  } = useDashboardData()

  const [goalAmountInput, setGoalAmountInput] = useState<string>('')
  const [longTermGoalInput, setLongTermGoalInput] = useState<string>('')
  const [simulatedAmount, setSimulatedAmount] = useState<number>(0)
  const [simulatedAmountInput, setSimulatedAmountInput] = useState<string>('')

  // Guarda de segurança para não renderizar dados quebrados.
  if (hasMissingData || !projection) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-[#9CA3AF]">Dados incompletos. Volte ao onboarding.</p>
      </section>
    )
  }

  // Simulação local: calcula impacto sem gravar nada no store.
  const simulateImpact = (amount: number) => {
    const sanitizedAmount = Math.max(amount, 0)
    const simulatedRemainingBalance = Math.max(projection.effectiveBalance - sanitizedAmount, 0)
    const simulatedDailyBudget = simulatedRemainingBalance / projection.daysLeft
    const simulatedRiskLevel = getRiskLevelByDailyBudget(simulatedDailyBudget)
    const simulatedFinalBalance = simulatedRemainingBalance + nextSalaryAmount

    return {
      simulatedDailyBudget,
      simulatedRiskLevel,
      simulatedFinalBalance,
    }
  }

  const simulation = simulateImpact(simulatedAmount)
  const riskRank = { safe: 1, warning: 2, danger: 3 } as const
  const isRiskWorse = riskRank[simulation.simulatedRiskLevel] > riskRank[projection.riskLevel]
  const remainingLongTermAmount = Math.max(longTermGoal.targetAmount - longTermGoal.accumulatedAmount, 0)
  // Clamp explícito para evitar overflow visual em qualquer cenário de dado.
  const clampedLongTermGoalPercentage = Math.max(0, Math.min(longTermGoalPercentage, 100))
  const groupedExpenses = useMemo(() => {
    const sortedExpenses = [...expenses].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      return Number.isNaN(dateDiff) ? 0 : dateDiff
    })

    const groups = sortedExpenses.reduce<Record<string, typeof sortedExpenses>>((accumulator, expense) => {
      const dateKey = getDateKeyFromISO(expense.date)

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = []
      }

      accumulator[dateKey].push(expense)
      return accumulator
    }, {})

    return Object.entries(groups)
      .sort(([dateKeyA], [dateKeyB]) => dateKeyA < dateKeyB ? 1 : -1)
      .map(([dateKey, groupedItems]) => ({
        dateKey,
        label: formatGroupDateLabel(dateKey),
        items: groupedItems,
      }))
  }, [expenses])

  const handleGoalAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '')

    if (!digits) {
      setGoalAmountInput('')
      setGoal(0)
      return
    }

    const numericValue = Number(digits) / 100
    const formattedValue = currencyFormatter.format(numericValue)

    setGoalAmountInput(formattedValue)
    setGoal(numericValue)
  }

  const handleLongTermGoalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '')

    if (!digits) {
      setLongTermGoalInput('')
      setLongTermGoal(0)
      return
    }

    const numericValue = Number(digits) / 100
    const formattedValue = currencyFormatter.format(numericValue)

    setLongTermGoalInput(formattedValue)
    setLongTermGoal(numericValue)
  }

  useEffect(() => {
    // Mantém input alinhado com o valor da meta salvo globalmente.
    setGoalAmountInput(goalAmount > 0 ? currencyFormatter.format(goalAmount) : '')
  }, [goalAmount])

  useEffect(() => {
    setLongTermGoalInput(longTermGoal.targetAmount > 0 ? currencyFormatter.format(longTermGoal.targetAmount) : '')
  }, [longTermGoal.targetAmount])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#F3F4F6]">Operações</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">Ajuste metas e operações do ciclo atual.</p>
      </header>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Meta mensal</h2>
        <label htmlFor="goal-amount" className="mt-4 block text-sm font-medium text-[#9CA3AF]">
          Valor da meta
        </label>
        <input
          id="goal-amount"
          type="text"
          inputMode="numeric"
          value={goalAmountInput}
          onChange={handleGoalAmountChange}
          className="mt-2 w-full rounded-2xl border border-[#232938] bg-[#0F1115] px-4 py-3 text-lg text-[#F3F4F6] outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
          placeholder="R$ 0,00"
          aria-label="Valor da meta"
        />
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Meta acumulativa</h2>
        <label htmlFor="long-term-goal" className="mt-4 block text-sm font-medium text-[#9CA3AF]">
          Valor da meta acumulativa
        </label>
        <input
          id="long-term-goal"
          type="text"
          inputMode="numeric"
          value={longTermGoalInput}
          onChange={handleLongTermGoalChange}
          className="mt-2 w-full rounded-2xl border border-[#232938] bg-[#0F1115] px-4 py-3 text-lg text-[#F3F4F6] outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
          placeholder="R$ 0,00"
          aria-label="Valor da meta acumulativa"
        />
      </section>

      {longTermGoal.targetAmount > 0 && (
        // Só mostra a meta acumulativa quando ela realmente foi definida.
        <article className={cardClass}>
          <p className="text-sm font-semibold text-[#F3F4F6]">Progresso da meta acumulativa</p>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            R$ {longTermGoal.accumulatedAmount.toFixed(2)} / R$ {longTermGoal.targetAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#9CA3AF]">{clampedLongTermGoalPercentage.toFixed(0)}%</p>

          <div className="mt-4 h-[10px] w-full overflow-hidden rounded-full bg-[#232938]">
            {/* Preenchimento premium com gradiente suave e animação de largura sem salto visual. */}
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${clampedLongTermGoalPercentage}%` }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
            />
          </div>

          <p className="mt-2 text-xs text-[#9CA3AF]">Faltam R$ {remainingLongTermAmount.toFixed(2)} para concluir.</p>
          {longTermGoal.isCompleted && <p className="mt-2 text-sm font-medium text-[#22C55E]">Meta concluída 🎉</p>}
        </article>
      )}

      {longTermGoal.targetAmount === 0 && (
        <article className={cardClass}>
          <EmptyState
            icon={PiggyBank}
            title="Meta acumulativa não definida"
            description="Defina um valor acima para começar a acompanhar seu progresso de longo prazo."
          />
        </article>
      )}

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Simular gasto</h2>
        <label htmlFor="simulated-expense" className="mt-4 block text-sm font-medium text-[#9CA3AF]">
          Valor para simular
        </label>
        <input
          id="simulated-expense"
          type="text"
          inputMode="numeric"
          value={simulatedAmountInput}
          onChange={(event) => {
            const formattedValue = formatThousandsInput(event.target.value)
            setSimulatedAmountInput(formattedValue)
            setSimulatedAmount(parseThousandsInput(formattedValue))
          }}
          className="mt-2 w-full rounded-2xl border border-[#232938] bg-[#0F1115] px-4 py-3 text-lg text-[#F3F4F6] outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
          placeholder="Ex: 200"
          aria-label="Valor para simular"
        />

        <article
          className={`mt-4 rounded-2xl border p-4 ${
            isRiskWorse ? 'border-[#EF4444]/50 bg-[#EF4444]/10' : 'border-[#232938] bg-[#0F1115]'
          }`}
        >
          <p className="text-sm font-semibold text-[#F3F4F6]">Após esse gasto:</p>
          <p className="mt-2 text-sm text-[#9CA3AF]">Novo orçamento diário: R$ {simulation.simulatedDailyBudget.toFixed(2)}</p>
          <p className="mt-1 text-sm text-[#9CA3AF]">Novo risco: {riskLabels[simulation.simulatedRiskLevel]}</p>
          <p className="mt-1 text-sm text-[#9CA3AF]">Novo saldo final: R$ {simulation.simulatedFinalBalance.toFixed(2)}</p>
          {isRiskWorse && (
            <p className="mt-2 text-sm font-medium text-[#EF4444]">Esta simulação piora seu nível de risco.</p>
          )}
        </article>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Gastos do ciclo</h2>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sem gastos neste ciclo"
            description="Quando você registrar gastos, eles aparecerão aqui para acompanhamento."
          />
        ) : (
          <div className="mt-4 space-y-4">
            {groupedExpenses.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{group.label}</p>

                <ul className="space-y-2">
                  {group.items.map((expense, index) => {
                    const category = normalizeCategory(expense.category)
                    const CategoryIcon = categoryIconMap[category]

                    return (
                      <SwipeExpenseItem
                        key={expense.id}
                        expense={{
                          id: expense.id,
                          amount: expense.amount,
                          category,
                          date: expense.date,
                        }}
                        categoryIcon={CategoryIcon}
                        onDelete={removeExpense}
                        index={index}
                      />
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
