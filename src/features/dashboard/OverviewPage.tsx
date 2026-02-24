import { motion } from 'framer-motion'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboardData } from './useDashboardData'
import { formatChartDate } from './dashboardUtils'

// Classe base dos cards para manter visual consistente.
const cardClass = 'rounded-2xl border border-[#232938] bg-[#161A22] p-6'

const riskBadgeStyles = {
  safe: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40',
  warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
  danger: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40',
} as const

const riskLabels = {
  safe: 'Seguro',
  warning: 'Atenção',
  danger: 'Alto risco',
} as const

export function OverviewPage() {
  const {
    currentBalance,
    longTermGoal,
    longTermGoalPercentage,
    projection,
    riskLevel,
    hasMissingData,
  } = useDashboardData()

  if (hasMissingData || !projection) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-[#9CA3AF]">Dados incompletos. Volte ao onboarding.</p>
      </section>
    )
  }

  const remainingLongTermAmount = Math.max(longTermGoal.targetAmount - longTermGoal.accumulatedAmount, 0)
  // Clamp explícito para evitar overflow visual em qualquer cenário de dado.
  const clampedLongTermGoalPercentage = Math.max(0, Math.min(longTermGoalPercentage, 100))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#F3F4F6]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">Visão inteligente do seu momento financeiro.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className={cardClass}>
          <p className="text-sm text-[#9CA3AF]">Saldo atual</p>
          <p className="mt-3 text-3xl font-extrabold text-[#F3F4F6]">R$ {currentBalance.toFixed(2)}</p>
        </article>

        <article className={cardClass}>
          <p className="text-sm text-[#9CA3AF]">Saldo efetivo no ciclo</p>
          <p className="mt-3 text-3xl font-extrabold text-[#F3F4F6]">R$ {projection.effectiveBalance.toFixed(2)}</p>
        </article>
      </section>

      <article className={cardClass}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#9CA3AF]">Indicador de risco</p>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeStyles[riskLevel]}`}>
            {riskLabels[riskLevel]}
          </span>
        </div>
        <p className="mt-3 text-sm text-[#F3F4F6]">Orçamento diário atual: R$ {projection.dailyBudget.toFixed(2)}</p>
      </article>

      {longTermGoal.targetAmount > 0 && (
        // Só mostra a meta acumulativa quando ela realmente foi definida.
        <article className={cardClass}>
          <p className="text-sm font-semibold text-[#F3F4F6]">Meta acumulativa</p>
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
