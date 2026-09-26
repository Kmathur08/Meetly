import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/users'

export function withAuthGuard(Component) {
  return function AuthGuard(props) {
    const [user, setUser] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      const token = localStorage.getItem('meetly_token')
      if (!token) {
        window.location.hash = 'signin'
        return
      }

      fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          if (!response.ok) throw new Error('unauthorized')
          return response.json()
        })
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('meetly_token')
          window.location.hash = 'signin'
        })
        .finally(() => setChecking(false))
    }, [])

    if (checking || !user) return <main className="guard-loading">Checking your Meetly session...</main>
    return <Component {...props} user={user} />
  }
}