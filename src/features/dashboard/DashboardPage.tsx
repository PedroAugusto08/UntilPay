import { useState, type ChangeEvent } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateProjection } from '../../services/projection'
import { useFinanceStore } from '../../store/useFinanceStore'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  const numericValue = Number(digits) / 100

  return currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue)
}

function parseCurrencyInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits) / 100
}

function formatChartDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-')

  if (!year || !month || !day) {
    return dateISO
  }

  return `${day}/${month}`
}

export function DashboardPage() {
  const currentBalance = useFinanceStore((state) => state.currentBalance)
  const nextSalaryDate = useFinanceStore((state) => state.nextSalaryDate)
  const nextSalaryAmount = useFinanceStore((state) => state.nextSalaryAmount)
  const expenses = useFinanceStore((state) => state.expenses)
  const addExpense = useFinanceStore((state) => state.addExpense)
  const [expenseAmountInput, setExpenseAmountInput] = useState<string>(currencyFormatter.format(0))

  const expenseAmount = parseCurrencyInput(expenseAmountInput)

  const hasMissingData = currentBalance <= 0 || !nextSalaryDate || nextSalaryAmount <= 0

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
    expenses,
  })

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

  const handleExpenseAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExpenseAmountInput(formatCurrencyInput(event.target.value))
  }

  const handleAddExpense = () => {
    if (expenseAmount <= 0) {
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`

    addExpense({
      id,
      amount: expenseAmount,
      date: today,
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
            <p className="text-sm text-slate-500">
              Saldo antes do salário: R$ {projection.projectedBalanceBeforeSalary.toFixed(2)}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Saldo após receber: R$ {projection.projectedBalanceAfterSalary.toFixed(2)}
            </p>
          </article>
        </div>

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
