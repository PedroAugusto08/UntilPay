import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboardData } from './useDashboardData'

// Visual padrão dos cards desta tela.
const cardClass = 'rounded-2xl border border-[#232938] bg-[#161A22] p-6'

export function HistoryPage() {
  const { chartData, hasMissingData } = useDashboardData()

  if (hasMissingData) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-[#9CA3AF]">Dados incompletos. Volte ao onboarding.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#F3F4F6]">Histórico</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">Evolução dos ciclos e metas cumpridas.</p>
      </header>

      <article className={cardClass}>
        <p className="mb-4 text-sm font-semibold text-[#F3F4F6]">Histórico de ciclos</p>

        {chartData.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Nenhum histórico de ciclo disponível ainda.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* Barras verdes/vermelhas indicam se a meta daquele ciclo foi atingida. */}
              <BarChart data={chartData}>
                <XAxis
                  dataKey="cycle"
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
                  formatter={(value) => [`R$ ${Number(value ?? 0).toFixed(2)}`, 'Economizado']}
                />
                <Bar dataKey="savedAmount" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cycle-bar-${index}-${entry.cycle}`} fill={entry.goalAchieved ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className={cardClass}>
        <p className="text-sm font-semibold text-[#F3F4F6]">Detalhamento de ciclos</p>
        <p className="mt-2 text-sm text-[#9CA3AF]">Em breve: lista detalhada por ciclo com metas e gastos.</p>
      </article>
    </div>
  )
}
