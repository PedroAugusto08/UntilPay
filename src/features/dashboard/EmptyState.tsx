import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      // Estado vazio premium: discreto, centralizado e com entrada suave.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-[320px] flex-col items-center justify-center gap-4 py-4 text-center"
    >
      <Icon size={38} className="text-gray-500" />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </motion.div>
  )
}
