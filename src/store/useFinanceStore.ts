import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Expense = {
  id: string
  amount: number
  date: string
}

type NewExpenseInput = {
  amount: number
}

export type CycleHistoryEntry = {
  cycleDate: string
  salary: number
  totalExpenses: number
  savedAmount: number
  goalAmount: number
  goalAchieved: boolean
}

const MAX_ROLLOVER_ITERATIONS = 120

function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

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

function toUTCStartOfDayISO(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()
}

function createExpenseId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildRolloverPatch(state: FinanceStore, forceOneCycle = false): Partial<FinanceStore> | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextSalaryDate = parseDateStartOfDay(state.nextSalaryDate)

  if (!nextSalaryDate) {
    return null
  }

  if (!forceOneCycle && today < nextSalaryDate) {
    return null
  }

  let activeCycleDate = new Date(nextSalaryDate)
  let activeExpenses = [...state.expenses]
  let activeGoalAmount = state.goalAmount
  const updatedHistory = [...state.cyclesHistory]
  let iterationCount = 0

  while ((forceOneCycle ? iterationCount === 0 : today >= activeCycleDate) && iterationCount < MAX_ROLLOVER_ITERATIONS) {
    const totalExpenses = activeExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const savedAmount = state.nextSalaryAmount - totalExpenses

    updatedHistory.push({
      cycleDate: formatDateISO(activeCycleDate),
      salary: state.nextSalaryAmount,
      totalExpenses,
      savedAmount,
      goalAmount: activeGoalAmount,
      goalAchieved: savedAmount >= activeGoalAmount,
    })

    activeExpenses = []
    activeGoalAmount = 0

    activeCycleDate = new Date(activeCycleDate)
    activeCycleDate.setMonth(activeCycleDate.getMonth() + 1)
    activeCycleDate.setHours(0, 0, 0, 0)
    iterationCount += 1
  }

  return {
    cyclesHistory: updatedHistory,
    expenses: activeExpenses,
    goalAmount: activeGoalAmount,
    nextSalaryDate: toUTCStartOfDayISO(activeCycleDate),
  }
}

type FinanceStore = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
  goalAmount: number
  expenses: Expense[]
  cyclesHistory: CycleHistoryEntry[]
  setCurrentBalance: (value: number) => void
  setNextSalaryDate: (value: string) => void
  setNextSalaryAmount: (value: number) => void
  setGoal: (amount: number) => void
  addExpense: (expense: NewExpenseInput) => void
  runSalaryCycleRollover: () => void
  forceSalaryCycleRollover: () => void
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => {
      const runSalaryCycleRollover = () => {
        const rolloverPatch = buildRolloverPatch(get())

        if (rolloverPatch) {
          set(rolloverPatch)
        }
      }

      const forceSalaryCycleRollover = () => {
        const rolloverPatch = buildRolloverPatch(get(), true)

        if (rolloverPatch) {
          set(rolloverPatch)
        }
      }

      return {
      currentBalance: 0,
      nextSalaryDate: '',
      nextSalaryAmount: 0,
      goalAmount: 0,
      expenses: [],
      cyclesHistory: [],
      setCurrentBalance: (value: number) =>
        set({
          currentBalance: value,
        }),
      setNextSalaryDate: (value: string) =>
        set(() => {
          const parsedDate = parseDateStartOfDay(value)

          if (!parsedDate) {
            return {
              nextSalaryDate: value,
            }
          }

          return {
            nextSalaryDate: toUTCStartOfDayISO(parsedDate),
          }
        }),
      setNextSalaryAmount: (value: number) =>
        set({
          nextSalaryAmount: value,
        }),
      setGoal: (amount: number) => {
        runSalaryCycleRollover()
        set({
          goalAmount: amount,
        })
      },
      addExpense: (expense: NewExpenseInput) => {
        runSalaryCycleRollover()
        set({
          expenses: [
            ...get().expenses,
            {
              id: createExpenseId(),
              ...expense,
              date: new Date().toISOString(),
            },
          ],
        })
      },
      runSalaryCycleRollover,
      forceSalaryCycleRollover,
    }
    },
    {
      name: 'untilpay-storage',
      partialize: (state) => ({
        currentBalance: state.currentBalance,
        nextSalaryDate: state.nextSalaryDate,
        nextSalaryAmount: state.nextSalaryAmount,
        goalAmount: state.goalAmount,
        expenses: state.expenses,
        cyclesHistory: state.cyclesHistory,
      }),
      onRehydrateStorage: () => (state) => {
        state?.runSalaryCycleRollover()
      },
    },
  ),
)
