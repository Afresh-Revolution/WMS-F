interface SpinnerProps {
  label?: string
}

export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
