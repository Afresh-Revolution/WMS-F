import { useLocalStorage } from '../../../hooks'
import type { User } from '../../../types'

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
}

export function useAuth() {
  const [auth, setAuth] = useLocalStorage<AuthState>('wms-auth', initialState)

  function setSession(user: User, token: string) {
    setAuth({ user, token })
  }

  function logout() {
    setAuth(initialState)
  }

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: Boolean(auth.token),
    setSession,
    logout,
  }
}
