export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Máscara monetária para inputs tipo "R$ 0,00".
export function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  const numericValue = Number(digits) / 100

  return currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue)
}

// Conversão da máscara monetária para número puro.
export function parseCurrencyInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits) / 100
}

export function formatThousandsInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(Number(digits))
}

// Converte string com separador de milhar para número.
export function parseThousandsInput(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '')
  return Number(digits || '0')
}

export function formatChartDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-')

  if (!year || !month || !day) {
    return dateISO
  }

  return `${day}/${month}`
}

// Label amigável para cada ciclo no gráfico de histórico.
export function formatCycleLabel(cycleDate: string): string {
  const parsedDate = new Date(cycleDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return cycleDate
  }

  return parsedDate.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
}

// Mesma régua de risco usada em toda a interface.
export function getRiskLevelByDailyBudget(dailyBudget: number): 'safe' | 'warning' | 'danger' {
  if (dailyBudget >= 100) {
    return 'safe'
  }

  if (dailyBudget >= 50) {
    return 'warning'
  }

  return 'danger'
}
