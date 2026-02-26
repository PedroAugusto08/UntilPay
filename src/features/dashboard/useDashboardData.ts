import { calculateProjection } from '../../services/projection'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCycleLabel } from './dashboardUtils'

// Hook central para concentrar dados e ações usados nas telas do dashboard.
export function useDashboardData() {
  const currentBalance = useFinanceStore((state) => state.currentBalance)
  const nextSalaryDate = useFinanceStore((state) => state.nextSalaryDate)
  const nextSalaryAmount = useFinanceStore((state) => state.nextSalaryAmount)
  const goalAmount = useFinanceStore((state) => state.goalAmount)
  const longTermGoal = useFinanceStore((state) => state.longTermGoal)
  const expenses = useFinanceStore((state) => state.expenses)
  const cyclesHistory = useFinanceStore((state) => state.cyclesHistory)

  const addExpense = useFinanceStore((state) => state.addExpense)
  const removeExpense = useFinanceStore((state) => state.removeExpense)
  const setGoal = useFinanceStore((state) => state.setGoal)
  const setLongTermGoal = useFinanceStore((state) => state.setLongTermGoal)

  // Se faltar base do onboarding, evitamos projeções inconsistentes.
  const hasMissingData = currentBalance <= 0 || !nextSalaryDate || nextSalaryAmount <= 0

  const projection = hasMissingData
    ? null
    : calculateProjection({
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

  const riskLevel = projection?.riskLevel ?? 'danger'

  return {
    currentBalance,
    nextSalaryDate,
    nextSalaryAmount,
    goalAmount,
    longTermGoal,
    expenses,
    chartData,
    hasMissingData,
    projection,
    longTermGoalPercentage,
    riskLevel,
    addExpense,
    removeExpense,
    setGoal,
    setLongTermGoal,
  }
}
