import { calculateProjection } from '../../services/projection'
import { useFinanceStore } from '../../store/useFinanceStore'

export function DashboardPage() {
  const currentBalance = useFinanceStore((state) => state.currentBalance)
  const nextSalaryDate = useFinanceStore((state) => state.nextSalaryDate)
  const nextSalaryAmount = useFinanceStore((state) => state.nextSalaryAmount)

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
  })

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <section className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Projeção financeira</h1>
          <p className="mt-1 text-sm text-slate-500">Resumo até seu próximo recebimento.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Dias restantes: {projection.daysLeft}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orçamento diário: R$ {projection.dailyBudget.toFixed(2)}</p>
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
      </section>
    </main>
  )
}
