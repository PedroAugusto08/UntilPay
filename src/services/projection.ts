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
  totalCycleDays: number
  daysPassed: number
  progressPercentage: number
  totalExpenses: number
  remainingBalance: number
  dailyBudget: number
  projectedBalanceBeforeSalary: number
  projectedBalanceAfterSalary: number
  isDeficit: boolean
  riskLevel: 'safe' | 'warning' | 'danger'
}

function getCycleProgress(nextSalaryDate: string): {
  totalCycleDays: number
  daysPassed: number
  progressPercentage: number
} {
  const today = new Date()
  const nextDate = new Date(nextSalaryDate)

  if (Number.isNaN(nextDate.getTime())) {
    return {
      totalCycleDays: 30,
      daysPassed: 0,
      progressPercentage: 0,
    }
  }

  today.setHours(0, 0, 0, 0)
  nextDate.setHours(0, 0, 0, 0)

  const lastSalaryDate = new Date(nextDate)
  lastSalaryDate.setDate(lastSalaryDate.getDate() - 30)
  lastSalaryDate.setHours(0, 0, 0, 0)

  const msPerDay = 1000 * 60 * 60 * 24
  const cycleDiff = nextDate.getTime() - lastSalaryDate.getTime()
  const totalCycleDays = Math.max(Math.round(cycleDiff / msPerDay), 1)

  const passedDiff = today.getTime() - lastSalaryDate.getTime()
  const unclampedDaysPassed = Math.floor(passedDiff / msPerDay)
  const daysPassed = Math.min(Math.max(unclampedDaysPassed, 0), totalCycleDays)

  const progressPercentage = Math.min(Math.max((daysPassed / totalCycleDays) * 100, 0), 100)

  return {
    totalCycleDays,
    daysPassed,
    progressPercentage,
  }
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
  const { totalCycleDays, daysPassed, progressPercentage } = getCycleProgress(nextSalaryDate)
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0)
  const remainingBalance = currentBalance - totalExpenses
  const dailyBudget = remainingBalance / daysLeft
  const projectedBalanceBeforeSalary = remainingBalance
  const projectedBalanceAfterSalary = remainingBalance + nextSalaryAmount
  const isDeficit = remainingBalance <= 0
  const riskLevel = dailyBudget >= 100 ? 'safe' : dailyBudget >= 50 ? 'warning' : 'danger'

  return {
    daysLeft,
    totalCycleDays,
    daysPassed,
    progressPercentage,
    totalExpenses,
    remainingBalance,
    dailyBudget,
    projectedBalanceBeforeSalary,
    projectedBalanceAfterSalary,
    isDeficit,
    riskLevel,
  }
}
