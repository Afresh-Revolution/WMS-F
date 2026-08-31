import { Link } from 'react-router-dom'
import { ROUTES } from '../lib/constants'

export function NotFoundPage() {
  return (
    <div className="auth-page">
      <h1>Page not found</h1>
      <p className="muted">The page you requested does not exist.</p>
      <Link className="btn btn-primary" to={ROUTES.dashboard}>
        Back to dashboard
      </Link>
    </div>
  )
}
