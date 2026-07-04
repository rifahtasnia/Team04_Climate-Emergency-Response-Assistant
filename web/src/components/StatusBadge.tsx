import type { ReactNode } from 'react'

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'critical' | 'warning' | 'success' | 'info' | 'neutral'
  children: ReactNode
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}
