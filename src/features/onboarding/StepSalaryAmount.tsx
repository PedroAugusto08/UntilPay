import { useState, type ChangeEvent } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'

type StepSalaryAmountProps = {
  onContinue: () => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Mesmo padrão de máscara monetária usado nas outras telas.
function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  const numericValue = Number(digits) / 100

  return currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue)
}

// Extrai o número real que será salvo no estado global.
function parseCurrencyInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits) / 100
}

export function StepSalaryAmount({ onContinue }: StepSalaryAmountProps) {
  const setNextSalaryAmount = useFinanceStore((state) => state.setNextSalaryAmount)
  const [salaryAmountInput, setSalaryAmountInput] = useState<string>(currencyFormatter.format(0))

  const salaryAmount = parseCurrencyInput(salaryAmountInput)

  const handleSalaryAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSalaryAmountInput(formatCurrencyInput(event.target.value))
  }

  const handleContinue = () => {
    // Salva salário informado e conclui o onboarding.
    setNextSalaryAmount(salaryAmount)
    onContinue()
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Quanto você vai receber?</h1>
      <p className="mt-2 text-sm text-slate-500">
        Informe o valor do próximo salário para montarmos sua projeção de caixa.
      </p>

      <label htmlFor="next-salary-amount" className="mt-6 block text-sm font-medium text-slate-700">
        Próximo salário
      </label>
      <input
        id="next-salary-amount"
        type="text"
        inputMode="numeric"
        value={salaryAmountInput}
        onChange={handleSalaryAmountChange}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        placeholder="R$ 0,00"
        aria-label="Próximo salário"
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={salaryAmount <= 0}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Continuar
      </button>
    </>
  )
}
