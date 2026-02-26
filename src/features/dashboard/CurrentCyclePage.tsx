import { useEffect, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Receipt } from 'lucide-react'
import { useDashboardData } from './useDashboardData'
import {
  currencyFormatter,
  formatThousandsInput,
  getRiskLevelByDailyBudget,
  parseThousandsInput,
} from './dashboardUtils'
import { EmptyState } from './EmptyState'

const cardClass = 'rounded-2xl border border-[#232938] bg-[#161A22] p-6'

const riskLabels = {
  safe: 'Seguro',
  warning: 'Atenção',
  danger: 'Alto',
} as const

export function CurrentCyclePage() {
  const {
    goalAmount,
    longTermGoal,
    longTermGoalPercentage,
    expenses,
    nextSalaryAmount,
    projection,
    hasMissingData,
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
          <ul className="mt-4 space-y-3">
            {[...expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => (
                <li key={expense.id} className="flex items-center justify-between rounded-xl border border-[#232938] bg-[#0F1115] px-4 py-3">
                  <span className="text-sm text-[#9CA3AF]">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                  <span className="text-sm font-semibold text-[#F3F4F6]">R$ {expense.amount.toFixed(2)}</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
