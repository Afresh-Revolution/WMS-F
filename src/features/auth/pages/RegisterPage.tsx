import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui'
import { ROUTES } from '../../../lib/constants'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  function handleSubmit(name: string, email: string, password: string) {
    console.info('register', { name, email, password })
  }

  return (
    <div className="auth-page">
      <Card title="Create your Afresh account">
        <RegisterForm onSubmit={handleSubmit} />
        <p className="muted">
          Already registered? <Link to={ROUTES.login}>Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
