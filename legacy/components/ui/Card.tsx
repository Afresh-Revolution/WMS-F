import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className }: CardProps) {
  return (
    <section className={cn('card', className)}>
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </section>
  )
}
