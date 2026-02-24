type RiskLevel = 'safe' | 'warning' | 'danger'

type RiskBadgeProps = {
  level: RiskLevel
  label: string
}

const riskBadgeColors: Record<RiskLevel, { textColor: string; backgroundColor: string }> = {
  safe: {
    textColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  warning: {
    textColor: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  danger: {
    textColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
}

export function RiskBadge({ level, label }: RiskBadgeProps) {
  const { textColor, backgroundColor } = riskBadgeColors[level]

  return (
    // Badge sutil: mantém contraste no tema escuro sem ficar agressivo.
    <div
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: textColor,
        backgroundColor,
      }}
    >
      {label}
    </div>
  )
}
