export type ProjectionParams = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
  expenses: Array<{
    id: string
    amount: number
    date: string
  }>
}

export type ProjectionResult = {
  daysLeft: number
  totalExpenses: number
  remainingBalance: number
  dailyBudget: number
  projectedBalanceBeforeSalary: number
  projectedBalanceAfterSalary: number
  isDeficit: boolean
}

function getDaysLeft(nextSalaryDate: string): number {
  const today = new Date()
  const targetDate = new Date(nextSalaryDate)

  if (Number.isNaN(targetDate.getTime())) {
    return 1
  }

  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const msPerDay = 1000 * 60 * 60 * 24
  const rawDiff = targetDate.getTime() - today.getTime()
  const diffInDays = Math.ceil(rawDiff / msPerDay)

  return Math.max(diffInDays, 1)
}

export function calculateProjection(params: ProjectionParams): ProjectionResult {
  const { currentBalance, nextSalaryDate, nextSalaryAmount, expenses } = params

  const daysLeft = getDaysLeft(nextSalaryDate)
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0)
  const remainingBalance = currentBalance - totalExpenses
  const dailyBudget = remainingBalance / daysLeft
  const projectedBalanceBeforeSalary = remainingBalance
  const projectedBalanceAfterSalary = remainingBalance + nextSalaryAmount
  const isDeficit = remainingBalance <= 0

  return {
    daysLeft,
    totalExpenses,
    remainingBalance,
    dailyBudget,
    projectedBalanceBeforeSalary,
    projectedBalanceAfterSalary,
    isDeficit,
  }
}
