import { useEffect, useState, type ChangeEvent } from 'react'
import { useDashboardData } from './useDashboardData'
import {
  currencyFormatter,
  formatCurrencyInput,
  formatThousandsInput,
  getRiskLevelByDailyBudget,
  parseCurrencyInput,
  parseThousandsInput,
} from './dashboardUtils'

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
    expenses,
    nextSalaryAmount,
    projection,
    hasMissingData,
    addExpense,
    setGoal,
    setLongTermGoal,
  } = useDashboardData()

  const [expenseAmountInput, setExpenseAmountInput] = useState<string>(currencyFormatter.format(0))
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

  const expenseAmount = parseCurrencyInput(expenseAmountInput)

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

  const handleExpenseAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExpenseAmountInput(formatCurrencyInput(event.target.value))
  }

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

  const handleAddExpense = () => {
    if (expenseAmount <= 0) {
      return
    }

    addExpense({
      amount: expenseAmount,
    })

    setExpenseAmountInput(currencyFormatter.format(0))
  }

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

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Adicionar gasto</h2>
        <label htmlFor="expense-amount" className="mt-4 block text-sm font-medium text-[#9CA3AF]">
          Valor do gasto
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="expense-amount"
            type="text"
            inputMode="numeric"
            value={expenseAmountInput}
            onChange={handleExpenseAmountChange}
            className="w-full rounded-2xl border border-[#232938] bg-[#0F1115] px-4 py-3 text-lg text-[#F3F4F6] outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
            placeholder="R$ 0,00"
            aria-label="Valor do gasto"
          />
          <button
            type="button"
            onClick={handleAddExpense}
            disabled={expenseAmount <= 0}
            className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:bg-[#232938]"
          >
            Adicionar gasto
          </button>
        </div>
      </section>

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
          <p className="mt-3 text-sm text-[#9CA3AF]">Nenhum gasto registrado no ciclo atual.</p>
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
