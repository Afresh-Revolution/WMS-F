import type { FormEvent } from 'react'
import { useState } from 'react'
import { Button, Input } from '../../../components/ui'

interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string) => void
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(name, email, password)
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <Input
        label="Name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Button type="submit">Create account</Button>
    </form>
  )
}
