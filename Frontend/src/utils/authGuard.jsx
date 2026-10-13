import { useEffect, useState } from 'react'
import { api, clearToken, getToken } from '../lib/api'

const redirectToSignIn = () => {
  sessionStorage.setItem('meetly_next', window.location.hash.slice(1))
  window.location.hash = 'signin'
}

export function withAuthGuard(Component) {
  return function AuthGuard(props) {
    const [user, setUser] = useState(null)

    useEffect(() => {
      if (!getToken()) return redirectToSignIn()

      let active = true
      api('me')
        .then((data) => active && setUser(data.user))
        .catch((error) => {
          if (!active) return
          // Keep the token on network errors; only a rejected session should sign the user out.
          if (error.status === 401) {
            clearToken()
            redirectToSignIn()
          } else {
            setUser(false)
          }
        })
      return () => { active = false }
    }, [])

    if (user === false) return <main className="guard-loading">Can't reach Meetly right now. <button onClick={() => window.location.reload()}>Try again</button></main>
    if (!user) return <main className="guard-loading">Checking your Meetly session...</main>
    return <Component {...props} user={user} />
  }
}
