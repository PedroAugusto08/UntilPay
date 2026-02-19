export type ProjectionParams = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
}

export type ProjectionResult = {
  daysLeft: number
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
  const { currentBalance, nextSalaryDate, nextSalaryAmount } = params

  const daysLeft = getDaysLeft(nextSalaryDate)
  const dailyBudget = currentBalance / daysLeft
  const projectedBalanceBeforeSalary = currentBalance
  const projectedBalanceAfterSalary = currentBalance + nextSalaryAmount
  const isDeficit = currentBalance <= 0

  return {
    daysLeft,
    dailyBudget,
    projectedBalanceBeforeSalary,
    projectedBalanceAfterSalary,
    isDeficit,
  }
}
