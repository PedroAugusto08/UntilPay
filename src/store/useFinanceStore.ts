import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Expense = {
  id: string
  amount: number
  date: string
}

type FinanceStore = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
  expenses: Expense[]
  setCurrentBalance: (value: number) => void
  setNextSalaryDate: (value: string) => void
  setNextSalaryAmount: (value: number) => void
  addExpense: (expense: Expense) => void
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      currentBalance: 0,
      nextSalaryDate: '',
      nextSalaryAmount: 0,
      expenses: [],
      setCurrentBalance: (value: number) =>
        set({
          currentBalance: value,
        }),
      setNextSalaryDate: (value: string) =>
        set({
          nextSalaryDate: value,
        }),
      setNextSalaryAmount: (value: number) =>
        set({
          nextSalaryAmount: value,
        }),
      addExpense: (expense: Expense) =>
        set((state) => ({
          expenses: [...state.expenses, expense],
        })),
    }),
    {
      name: 'untilpay-storage',
      partialize: (state) => ({
        currentBalance: state.currentBalance,
        nextSalaryDate: state.nextSalaryDate,
        nextSalaryAmount: state.nextSalaryAmount,
        expenses: state.expenses,
      }),
    },
  ),
)
