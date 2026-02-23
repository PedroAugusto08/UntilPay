import { useEffect, useState, type ChangeEvent } from 'react'
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateProjection } from '../../services/projection'
import { useFinanceStore } from '../../store/useFinanceStore'

// Componente legado da dashboard (mantido para referência/migração).
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  const numericValue = Number(digits) / 100

  return currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue)
}

// Conversão da máscara monetária para número.
function parseCurrencyInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits) / 100
}

function formatThousandsInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(Number(digits))
}

function parseThousandsInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits || '0')
}

function formatChartDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-')

  if (!year || !month || !day) {
    return dateISO
  }

  return `${day}/${month}`
}

function formatCycleLabel(cycleDate: string): string {
  const parsedDate = new Date(cycleDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return cycleDate
  }

  return parsedDate.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
}

export function DashboardPage() {
  const currentBalance = useFinanceStore((state) => state.currentBalance)
  const nextSalaryDate = useFinanceStore((state) => state.nextSalaryDate)
  const nextSalaryAmount = useFinanceStore((state) => state.nextSalaryAmount)
  const goalAmount = useFinanceStore((state) => state.goalAmount)
  const longTermGoal = useFinanceStore((state) => state.longTermGoal)
  const expenses = useFinanceStore((state) => state.expenses)
  const cyclesHistory = useFinanceStore((state) => state.cyclesHistory)
  const addExpense = useFinanceStore((state) => state.addExpense)
  const setGoal = useFinanceStore((state) => state.setGoal)
  const setLongTermGoal = useFinanceStore((state) => state.setLongTermGoal)

  const [expenseAmountInput, setExpenseAmountInput] = useState<string>(currencyFormatter.format(0))
  const [goalAmountInput, setGoalAmountInput] = useState<string>('')
  const [longTermGoalInput, setLongTermGoalInput] = useState<string>('')
  const [simulatedAmount, setSimulatedAmount] = useState<number>(0)
  const [simulatedAmountInput, setSimulatedAmountInput] = useState<string>('')

  const expenseAmount = parseCurrencyInput(expenseAmountInput)

  const hasMissingData = currentBalance <= 0 || !nextSalaryDate || nextSalaryAmount <= 0

  // Se faltar base do onboarding, mostramos aviso amigável.
  if (hasMissingData) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-amber-800">Dados incompletos. Volte ao onboarding.</p>
          </div>
        </section>
      </main>
    )
  }

  const projection = calculateProjection({
    currentBalance,
    nextSalaryDate,
    nextSalaryAmount,
    goalAmount,
    expenses,
  })

  const chartData = cyclesHistory.map((cycle) => ({
    cycle: formatCycleLabel(cycle.cycleDate),
    savedAmount: cycle.savedAmount,
    goalAmount: cycle.goalAmount,
    goalAchieved: cycle.goalAchieved,
  }))

  const longTermGoalPercentage =
    longTermGoal.targetAmount > 0
      ? Math.min((longTermGoal.accumulatedAmount / longTermGoal.targetAmount) * 100, 100)
      : 0

  const riskStyles = {
    safe: {
      container: 'border-green-200 bg-green-50',
      title: 'text-green-800',
      label: 'Seguro',
      message: 'Seu orçamento diário está saudável.',
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50',
      title: 'text-yellow-800',
      label: 'Atenção',
      message: 'Mantenha controle dos gastos para evitar aperto.',
    },
    danger: {
      container: 'border-red-200 bg-red-50',
      title: 'text-red-800',
      label: 'Alto',
      message: 'Seu orçamento diário está baixo e exige ajustes.',
    },
  } as const

  const riskCard = riskStyles[projection.riskLevel]
  const progressBarColor = {
    safe: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }[projection.riskLevel]

  const getRiskLevelByDailyBudget = (dailyBudget: number): 'safe' | 'warning' | 'danger' => {
    if (dailyBudget >= 100) {
      return 'safe'
    }

    if (dailyBudget >= 50) {
      return 'warning'
    }

    return 'danger'
  }

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
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <section className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Projeção financeira</h1>
          <p className="mt-1 text-sm text-slate-500">Resumo até seu próximo recebimento.</p>
        </header>

        <article className={`mb-6 rounded-2xl border p-5 shadow-sm ${riskCard.container}`}>
          <p className={`text-sm font-semibold uppercase tracking-wide ${riskCard.title}`}>
            Risco: {riskCard.label}
          </p>
          <p className="mt-1 text-sm text-slate-700">{riskCard.message}</p>
        </article>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meta de economia</h2>
          <p className="mt-1 text-sm text-slate-500">Defina uma meta para reservar antes do próximo salário.</p>

          <label htmlFor="goal-amount" className="mt-4 block text-sm font-medium text-slate-700">
            Valor da meta
          </label>
          <input
            id="goal-amount"
            type="text"
            inputMode="numeric"
            value={goalAmountInput}
            onChange={handleGoalAmountChange}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="R$ 0,00"
            aria-label="Valor da meta"
          />
        </section>

        <article
          className={`mb-6 rounded-2xl border p-5 shadow-sm ${
            projection.achievable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">Meta Ativa</p>
          <p className="mt-2 text-sm text-slate-700">Valor da meta: R$ {goalAmount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-700">Orçamento diário efetivo: R$ {projection.dailyBudget.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-700">Status: {projection.achievable ? 'atingível' : 'quebrada'}</p>
        </article>

        <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Progresso do ciclo salarial</p>
            <p className="text-sm font-semibold text-slate-900">{projection.progressPercentage.toFixed(0)}%</p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
              style={{ width: `${projection.progressPercentage}%` }}
            />
          </div>
        </article>

        <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Projeção diária de saldo</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection.dailyProjection}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value) => [`R$ ${Number(value ?? 0).toFixed(2)}`, 'Saldo projetado']}
                  labelFormatter={(label) => `Data: ${formatChartDate(String(label))}`}
                />
                <Line
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meta acumulativa</h2>
          <p className="mt-1 text-sm text-slate-500">Defina uma meta de longo prazo para acumular ao longo dos ciclos.</p>

          <label htmlFor="long-term-goal" className="mt-4 block text-sm font-medium text-slate-700">
            Valor da meta acumulativa
          </label>
          <input
            id="long-term-goal"
            type="text"
            inputMode="numeric"
            value={longTermGoalInput}
            onChange={handleLongTermGoalChange}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="R$ 0,00"
            aria-label="Valor da meta acumulativa"
          />
        </section>

        {longTermGoal.targetAmount > 0 && (
          <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Meta acumulativa</p>
            <p className="mt-2 text-sm text-slate-700">
              R$ {longTermGoal.accumulatedAmount.toFixed(2)} / R$ {longTermGoal.targetAmount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">{longTermGoalPercentage.toFixed(0)}%</p>

            <div className="mt-3 h-2 w-full rounded bg-slate-200">
              <div
                className={`h-2 rounded transition-all duration-500 ease-out ${
                  longTermGoal.isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${longTermGoalPercentage}%` }}
              />
            </div>

            {longTermGoal.isCompleted && (
              <p className="mt-2 text-sm font-medium text-green-700">Meta concluída 🎉</p>
            )}
          </article>
        )}

        <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Histórico de ciclos</p>

          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum histórico de ciclo disponível ainda.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="cycle"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value ?? 0)

                      if (name === 'savedAmount') {
                        return [`R$ ${numericValue.toFixed(2)}`, 'Economizado']
                      }

                      return [`R$ ${numericValue.toFixed(2)}`, 'Meta']
                    }}
                  />
                  <Bar dataKey="savedAmount" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={`cycle-bar-${entry.cycle}`} fill={entry.goalAchieved ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Dias restantes: {projection.daysLeft}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orçamento diário: R$ {projection.dailyBudget.toFixed(2)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de gastos: R$ {projection.totalExpenses.toFixed(2)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo restante: R$ {projection.remainingBalance.toFixed(2)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo efetivo: R$ {projection.effectiveBalance.toFixed(2)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo após receber: R$ {projection.projectedBalanceAfterSalary.toFixed(2)}</p>
          </article>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Simular gasto</h2>
          <p className="mt-1 text-sm text-slate-500">Veja o impacto de um novo gasto sem salvar no sistema.</p>

          <label htmlFor="simulated-expense" className="mt-4 block text-sm font-medium text-slate-700">
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
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Ex: 200"
            aria-label="Valor para simular"
          />

          <article
            className={`mt-4 rounded-xl border p-4 ${
              isRiskWorse ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">Após esse gasto:</p>
            <p className="mt-2 text-sm text-slate-700">Novo orçamento diário: R$ {simulation.simulatedDailyBudget.toFixed(2)}</p>
            <p className="mt-1 text-sm text-slate-700">Novo risco: {riskStyles[simulation.simulatedRiskLevel].label}</p>
            <p className="mt-1 text-sm text-slate-700">Novo saldo final: R$ {simulation.simulatedFinalBalance.toFixed(2)}</p>
            {isRiskWorse && (
              <p className="mt-2 text-sm font-medium text-red-700">Esta simulação piora seu nível de risco.</p>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Adicionar gasto</h2>
          <p className="mt-1 text-sm text-slate-500">Registre um novo gasto para atualizar sua projeção.</p>

          <label htmlFor="expense-amount" className="mt-4 block text-sm font-medium text-slate-700">
            Valor do gasto
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              value={expenseAmountInput}
              onChange={handleExpenseAmountChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="R$ 0,00"
              aria-label="Valor do gasto"
            />
            <button
              type="button"
              onClick={handleAddExpense}
              disabled={expenseAmount <= 0}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Adicionar gasto
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}
