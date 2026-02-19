import { useState, type ChangeEvent } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'

type StepSalaryDateProps = {
  onContinue: () => void
}

export function StepSalaryDate({ onContinue }: StepSalaryDateProps) {
  const setNextSalaryDate = useFinanceStore((state) => state.setNextSalaryDate)
  const [salaryDate, setSalaryDate] = useState<string>('')

  const handleSalaryDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSalaryDate(event.target.value)
  }

  const handleContinue = () => {
    setNextSalaryDate(salaryDate)
    onContinue()
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Quando você recebe?</h1>
      <p className="mt-2 text-sm text-slate-500">
        Escolha a data do seu próximo salário para planejarmos melhor seu fluxo de caixa.
      </p>

      <label htmlFor="next-salary-date" className="mt-6 block text-sm font-medium text-slate-700">
        Próxima data de salário
      </label>
      <input
        id="next-salary-date"
        type="date"
        value={salaryDate}
        onChange={handleSalaryDateChange}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        aria-label="Próxima data de salário"
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={salaryDate.length === 0}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Continuar
      </button>
    </>
  )
}
