import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui'
import { ROUTES } from '../../../lib/constants'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  function handleSubmit(email: string, password: string) {
    console.info('login', { email, password })
  }

  return (
    <div className="auth-page">
      <Card title="Sign in to Afresh WMS">
        <LoginForm onSubmit={handleSubmit} />
        <p className="muted">
          Need an account? <Link to={ROUTES.register}>Register</Link>
        </p>
      </Card>
    </div>
  )
}
