import CountUp from 'react-countup'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboardData } from './useDashboardData'
import { currencyFormatter, formatChartDate, formatCurrencyInput, parseCurrencyInput } from './dashboardUtils'

// Classe base dos cards para manter visual consistente.
const cardClass = 'rounded-2xl border border-[#232938] bg-[#161A22] p-6'

const riskCardStyles = {
  safe: {
    accentClass: 'bg-emerald-500/70',
    progressClass: 'bg-emerald-500',
    labelClass: 'text-emerald-300/90',
    label: 'Risco: Controlado',
  },
  warning: {
    accentClass: 'bg-amber-500/70',
    progressClass: 'bg-amber-500',
    labelClass: 'text-amber-300/90',
    label: 'Risco: Atenção',
  },
  danger: {
    accentClass: 'bg-rose-600/70',
    progressClass: 'bg-rose-600',
    labelClass: 'text-rose-300/90',
    label: 'Risco: Crítico',
  },
} as const

export function OverviewPage() {
  const {
    addExpense,
    projection,
    riskLevel,
    hasMissingData,
  } = useDashboardData()
  const displayedBalance = projection?.effectiveBalance ?? 0
  const previousBalanceRef = useRef(displayedBalance)
  const [countStart, setCountStart] = useState(displayedBalance)
  const [expenseAmountInput, setExpenseAmountInput] = useState<string>(currencyFormatter.format(0))

  useEffect(() => {
    // Count-up inicia do saldo anterior para manter animação suave entre atualizações.
    setCountStart(previousBalanceRef.current)
    previousBalanceRef.current = displayedBalance
  }, [displayedBalance])

  if (hasMissingData || !projection) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-[#9CA3AF]">Dados incompletos. Volte ao onboarding.</p>
      </section>
    )
  }

  const expenseAmount = parseCurrencyInput(expenseAmountInput)
  const clampedCycleProgress = Math.max(0, Math.min(projection.progressPercentage, 100))
  const activeRiskStyle = riskCardStyles[riskLevel]

  const handleExpenseAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExpenseAmountInput(formatCurrencyInput(event.target.value))
  }

  const handleAddExpense = () => {
    if (expenseAmount <= 0) {
      return
    }

    addExpense({ amount: expenseAmount })
    setExpenseAmountInput(currencyFormatter.format(0))
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#F3F4F6]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">Visão inteligente do seu momento financeiro.</p>
      </header>

      <section className="grid gap-4">
        <article className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-xl shadow-black/30 sm:p-7">
          {/* Acento lateral para leitura instantânea do nível de risco no card principal. */}
          <span className={`absolute inset-y-0 left-0 w-[3px] rounded-full ${activeRiskStyle.accentClass}`} />

          <p className="text-xs uppercase tracking-wider text-gray-400">Saldo disponível</p>
          <p className="mt-3 text-4xl font-semibold leading-none tabular-nums text-gray-100 sm:text-5xl">
            R${' '}
            <CountUp
              start={countStart}
              end={displayedBalance}
              duration={0.5}
              separator="."
              decimal=","
              decimals={2}
            />
          </p>
          <p className={`mt-3 text-xs font-medium ${activeRiskStyle.labelClass}`}>{activeRiskStyle.label}</p>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-400">Progresso do ciclo</p>
              <p className="text-xs font-medium text-gray-300">{clampedCycleProgress.toFixed(0)}%</p>
            </div>
            <div className="h-[10px] w-full overflow-hidden rounded-full bg-[#232938]">
              <div
                className={`h-full rounded-full ${activeRiskStyle.progressClass}`}
                style={{ width: `${clampedCycleProgress}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-400">Ciclo atual • termina em {projection.daysLeft} dias</p>
        </article>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[#F3F4F6]">Adicionar gasto</h2>
        <label htmlFor="expense-amount-dashboard" className="mt-4 block text-sm font-medium text-[#9CA3AF]">
          Valor do gasto
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="expense-amount-dashboard"
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

      <article className={cardClass}>
        <p className="text-sm font-semibold text-[#F3F4F6]">Resumo de projeção</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[#9CA3AF]">Dias restantes</p>
            <p className="mt-1 text-lg font-semibold text-[#F3F4F6]">{projection.daysLeft}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF]">Antes do salário</p>
            <p className="mt-1 text-lg font-semibold text-[#F3F4F6]">R$ {projection.projectedBalanceBeforeSalary.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF]">Após salário</p>
            <p className="mt-1 text-lg font-semibold text-[#F3F4F6]">R$ {projection.projectedBalanceAfterSalary.toFixed(2)}</p>
          </div>
        </div>
      </article>

      <article className={cardClass}>
        <p className="mb-4 text-sm font-semibold text-[#F3F4F6]">Projeção diária de saldo</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* Linha de queda de saldo até o próximo recebimento. */}
            <LineChart data={projection.dailyProjection}>
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161A22',
                  border: '1px solid #232938',
                  borderRadius: '12px',
                  color: '#F3F4F6',
                }}
                formatter={(value) => [`R$ ${Number(value ?? 0).toFixed(2)}`, 'Saldo projetado']}
                labelFormatter={(label) => `Data: ${formatChartDate(String(label))}`}
              />
              <Line type="monotone" dataKey="projectedBalance" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  )
}
