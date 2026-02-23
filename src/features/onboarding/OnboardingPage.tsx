import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepBalance } from './StepBalance'
import { StepSalaryDate } from './StepSalaryDate'
import { StepSalaryAmount } from './StepSalaryAmount'

type OnboardingStep = 'balance' | 'salary-date' | 'salary-amount'

// Controla o fluxo em 3 etapas até liberar o dashboard.
export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('balance')

  const handleBalanceContinue = () => {
    setCurrentStep('salary-date')
  }

  const handleSalaryDateContinue = () => {
    setCurrentStep('salary-amount')
  }

  const handleSalaryAmountContinue = () => {
    // Ao concluir onboarding, leva o usuário para a área principal.
    navigate('/dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Renderização condicional das etapas para manter tela simples */}
          {currentStep === 'balance' && <StepBalance onContinue={handleBalanceContinue} />}
          {currentStep === 'salary-date' && <StepSalaryDate onContinue={handleSalaryDateContinue} />}
          {currentStep === 'salary-amount' && (
            <StepSalaryAmount onContinue={handleSalaryAmountContinue} />
          )}
        </div>
      </section>
    </main>
  )
}
