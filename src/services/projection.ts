export type ProjectionParams = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
  goalAmount: number
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
  dailyProjection: Array<{
    date: string
    projectedBalance: number
  }>
  totalExpenses: number
  remainingBalance: number
  effectiveBalance: number
  adjustedBalance: number
  adjustedDailyBudget: number
  achievable: boolean
  dailyBudget: number
  projectedBalanceBeforeSalary: number
  projectedBalanceAfterSalary: number
  isDeficit: boolean
  riskLevel: 'safe' | 'warning' | 'danger'
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
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
  const { currentBalance, nextSalaryDate, nextSalaryAmount, goalAmount, expenses } = params

  const daysLeft = getDaysLeft(nextSalaryDate)
  const { totalCycleDays, daysPassed, progressPercentage } = getCycleProgress(nextSalaryDate)
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0)
  const remainingBalance = currentBalance - totalExpenses
  const effectiveBalance = remainingBalance - goalAmount
  const achievable = effectiveBalance >= 0
  const dailyBudget = achievable ? effectiveBalance / daysLeft : 0
  const adjustedBalance = effectiveBalance
  const adjustedDailyBudget = dailyBudget
  const projectedBalanceBeforeSalary = effectiveBalance
  const projectedBalanceAfterSalary = effectiveBalance + nextSalaryAmount
  const isDeficit = effectiveBalance <= 0
  const riskLevel = dailyBudget >= 100 ? 'safe' : dailyBudget >= 50 ? 'warning' : 'danger'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyProjection = Array.from({ length: daysLeft }, (_, dayIndex) => {
    const projectionDate = new Date(today)
    projectionDate.setDate(today.getDate() + dayIndex)

    return {
      date: formatDateISO(projectionDate),
      projectedBalance: Math.max(effectiveBalance - dailyBudget * dayIndex, 0),
    }
  })

  return {
    daysLeft,
    totalCycleDays,
    daysPassed,
    progressPercentage,
    dailyProjection,
    totalExpenses,
    remainingBalance,
    effectiveBalance,
    adjustedBalance,
    adjustedDailyBudget,
    achievable,
    dailyBudget,
    projectedBalanceBeforeSalary,
    projectedBalanceAfterSalary,
    isDeficit,
    riskLevel,
  }
}
