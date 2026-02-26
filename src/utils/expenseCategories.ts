export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
