interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header-title">{title}</h1>
        {subtitle ? <p className="header-subtitle">{subtitle}</p> : null}
      </div>
    </header>
  )
}
