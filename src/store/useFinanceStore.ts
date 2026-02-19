import { create } from 'zustand'

type FinanceStore = {
  currentBalance: number
  nextSalaryDate: string
  nextSalaryAmount: number
  setCurrentBalance: (value: number) => void
  setNextSalaryDate: (value: string) => void
  setNextSalaryAmount: (value: number) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  currentBalance: 0,
  nextSalaryDate: '',
  nextSalaryAmount: 0,
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
}))
