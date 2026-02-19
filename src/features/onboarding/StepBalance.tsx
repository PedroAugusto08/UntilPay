import { useState, type ChangeEvent } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'

type StepBalanceProps = {
  onContinue: () => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  const numericValue = Number(digits) / 100

  return currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue)
}

function parseCurrencyInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits) / 100
}

export function StepBalance({ onContinue }: StepBalanceProps) {
  const setCurrentBalance = useFinanceStore((state) => state.setCurrentBalance)
  const [balanceInput, setBalanceInput] = useState<string>(currencyFormatter.format(0))

  const currentValue = parseCurrencyInput(balanceInput)

  const handleBalanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setBalanceInput(formatCurrencyInput(event.target.value))
  }

  const handleContinue = () => {
    setCurrentBalance(currentValue)
    onContinue()
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Quanto você tem hoje?</h1>
      <p className="mt-2 text-sm text-slate-500">
        Informe seu saldo atual para começarmos seu painel financeiro.
      </p>

      <label htmlFor="current-balance" className="mt-6 block text-sm font-medium text-slate-700">
        Saldo atual
      </label>
      <input
        id="current-balance"
        type="text"
        inputMode="numeric"
        value={balanceInput}
        onChange={handleBalanceChange}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        placeholder="R$ 0,00"
        aria-label="Saldo atual"
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={currentValue <= 0}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Continuar
      </button>
    </>
  )
}
