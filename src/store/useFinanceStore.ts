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

export type LongTermGoal = {
  targetAmount: number
  accumulatedAmount: number
  isCompleted: boolean
}

// Trava de segurança para evitar loop infinito em cenários de data inválida.
const MAX_ROLLOVER_ITERATIONS = 120

// Formata data no padrão YYYY-MM-DD para manter consistência no histórico.
function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Faz parsing defensivo de data e normaliza no início do dia.
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

// Armazena apenas data (sem horário local), reduzindo ruído por fuso horário.
function toUTCStartOfDayISO(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()
}

// Gera id único para cada gasto sem depender de backend.
function createExpenseId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Monta as mudanças de rollover (fechar ciclo atual e abrir próximo).
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
  let activeLongTermGoal: LongTermGoal = {
    ...state.longTermGoal,
  }
  const updatedHistory = [...state.cyclesHistory]
  let iterationCount = 0

  // Processa um ou mais ciclos vencidos até ficar em dia com a data atual.
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

    if (
      savedAmount > 0 &&
      activeLongTermGoal.targetAmount > 0 &&
      !activeLongTermGoal.isCompleted
    ) {
      // Todo valor positivo economizado ajuda a completar a meta acumulativa.
      const nextAccumulatedAmount = activeLongTermGoal.accumulatedAmount + savedAmount

      activeLongTermGoal = {
        ...activeLongTermGoal,
        accumulatedAmount: nextAccumulatedAmount,
        isCompleted: nextAccumulatedAmount >= activeLongTermGoal.targetAmount,
      }
    }

    activeExpenses = []
    activeGoalAmount = 0

    activeCycleDate = new Date(activeCycleDate)
    activeCycleDate.setMonth(activeCycleDate.getMonth() + 1)
    activeCycleDate.setHours(0, 0, 0, 0)
    iterationCount += 1
  }

  return {
    cyclesHistory: updatedHistory,
    longTermGoal: activeLongTermGoal,
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
  longTermGoal: LongTermGoal
  expenses: Expense[]
  cyclesHistory: CycleHistoryEntry[]
  setCurrentBalance: (value: number) => void
  setNextSalaryDate: (value: string) => void
  setNextSalaryAmount: (value: number) => void
  setGoal: (amount: number) => void
  setLongTermGoal: (target: number) => void
  resetLongTermGoal: () => void
  addExpense: (expense: NewExpenseInput) => void
  runSalaryCycleRollover: () => void
  forceSalaryCycleRollover: () => void
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => {
      // Rollover automático: roda sempre que alguma ação importante acontece.
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
      longTermGoal: {
        targetAmount: 0,
        accumulatedAmount: 0,
        isCompleted: false,
      },
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
        // Antes de trocar meta, garante que o ciclo não está atrasado.
        runSalaryCycleRollover()
        set({
          goalAmount: amount,
        })
      },
      setLongTermGoal: (target: number) => {
        // Mantém meta acumulativa coerente com o progresso já salvo.
        runSalaryCycleRollover()
        set((state) => {
          const normalizedTarget = Math.max(target, 0)
          const completed = normalizedTarget > 0 && state.longTermGoal.accumulatedAmount >= normalizedTarget

          return {
            longTermGoal: {
              ...state.longTermGoal,
              targetAmount: normalizedTarget,
              isCompleted: completed,
            },
          }
        })
      },
      resetLongTermGoal: () =>
        set({
          longTermGoal: {
            targetAmount: 0,
            accumulatedAmount: 0,
            isCompleted: false,
          },
        }),
      addExpense: (expense: NewExpenseInput) => {
        // Cada novo gasto é salvo já com id e data para histórico.
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
      // Chave única do Zustand persist no localStorage.
      name: 'untilpay-storage',
      partialize: (state) => ({
        currentBalance: state.currentBalance,
        nextSalaryDate: state.nextSalaryDate,
        nextSalaryAmount: state.nextSalaryAmount,
        goalAmount: state.goalAmount,
        longTermGoal: state.longTermGoal,
        expenses: state.expenses,
        cyclesHistory: state.cyclesHistory,
      }),
      onRehydrateStorage: () => (state) => {
        // Quando recarrega a aplicação, já sincroniza ciclos vencidos.
        state?.runSalaryCycleRollover()
      },
    },
  ),
)
