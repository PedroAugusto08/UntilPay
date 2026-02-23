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

// Padroniza datas para YYYY-MM-DD (bom para gráficos e comparações).
function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Aceita string de data em formatos comuns e devolve início do dia.
function parseDateStartOfDay(dateValue: string): Date | null {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateMatch) {
    const year = Number(dateMatch[1])
    const month = Number(dateMatch[2]) - 1
    const day = Number(dateMatch[3])
    return new Date(year, month, day)
  }

  const parsedDate = new Date(dateValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  parsedDate.setHours(0, 0, 0, 0)
  return parsedDate
}

// Calcula o avanço do ciclo salarial atual para alimentar barra de progresso.
function getCycleProgress(nextSalaryDate: string): {
  totalCycleDays: number
  daysPassed: number
  progressPercentage: number
} {
  const today = new Date()
  const nextDate = parseDateStartOfDay(nextSalaryDate)

  if (!nextDate) {
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

// Garante que sempre exista ao menos 1 dia restante para evitar divisão por zero.
function getDaysLeft(nextSalaryDate: string): number {
  const today = new Date()
  const targetDate = parseDateStartOfDay(nextSalaryDate)

  if (!targetDate) {
    return 1
  }

  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const msPerDay = 1000 * 60 * 60 * 24
  const rawDiff = targetDate.getTime() - today.getTime()
  const diffInDays = Math.ceil(rawDiff / msPerDay)

  return Math.max(diffInDays, 1)
}

// Motor principal de projeção: transforma estado atual em métricas para a UI.
export function calculateProjection(params: ProjectionParams): ProjectionResult {
  const { currentBalance, nextSalaryDate, nextSalaryAmount, goalAmount, expenses } = params

  const daysLeft = getDaysLeft(nextSalaryDate)
  const safeDaysLeft = daysLeft > 0 ? daysLeft : 1
  const safeCurrentBalance = Number.isFinite(currentBalance) ? currentBalance : 0
  const safeNextSalaryAmount = Number.isFinite(nextSalaryAmount) ? nextSalaryAmount : 0
  const safeGoalAmount = Number.isFinite(goalAmount) ? goalAmount : 0
  const { totalCycleDays, daysPassed, progressPercentage } = getCycleProgress(nextSalaryDate)
  const totalExpenses = expenses.reduce((total, expense) => {
    const amount = Number.isFinite(expense.amount) ? expense.amount : 0
    return total + amount
  }, 0)

  // Saldo disponível para o dia a dia depois de gastos e meta do ciclo.
  const remainingBalance = safeCurrentBalance - totalExpenses
  const rawEffectiveBalance = remainingBalance - safeGoalAmount
  const achievable = rawEffectiveBalance >= 0
  const effectiveBalance = Math.max(0, rawEffectiveBalance)
  const dailyBudget = safeDaysLeft > 0 ? (achievable ? effectiveBalance / safeDaysLeft : 0) : 0
  const adjustedBalance = effectiveBalance
  const adjustedDailyBudget = dailyBudget
  const projectedBalanceBeforeSalary = effectiveBalance
  const projectedBalanceAfterSalary = effectiveBalance + safeNextSalaryAmount
  const isDeficit = effectiveBalance <= 0

  // Regra simples de risco baseada no orçamento diário.
  const riskLevel = !achievable ? 'danger' : dailyBudget >= 100 ? 'safe' : dailyBudget >= 50 ? 'warning' : 'danger'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyProjection = Array.from({ length: safeDaysLeft }, (_, dayIndex) => {
    const projectionDate = new Date(today)
    projectionDate.setDate(today.getDate() + dayIndex)

    return {
      date: formatDateISO(projectionDate),
      projectedBalance: Math.max(effectiveBalance - dailyBudget * dayIndex, 0),
    }
  })

  return {
    daysLeft: safeDaysLeft,
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
