import { useState } from 'react'
import './authentication.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/users'

function Brand() {
  return <span className="brand-mark"><i /><i /><i /></span>
}

export default function Authentication({ initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const changeMode = (nextMode) => {
    setMode(nextMode)
    setStatus({ type: '', message: '' })
    window.history.replaceState(null, '', `#${nextMode}`)
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (mode === 'signup' && form.password.length < 8) {
      setStatus({ type: 'error', message: 'Your password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    const endpoint = mode === 'signin' ? 'login' : mode === 'signup' ? 'register' : 'forgot-password'
    const body = mode === 'signin'
      ? { username: form.username, password: form.password }
      : mode === 'signup'
        ? form
        : { username: form.username }

    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.')

      if (mode === 'signin' && data.token) localStorage.setItem('meetly_token', data.token)
      setStatus({ type: 'success', message: mode === 'forgot-password' ? data.message : data.message || 'Welcome to Meetly.' })
      if (mode === 'signup') window.setTimeout(() => changeMode('signin'), 900)
    } catch (error) {
      setStatus({ type: 'error', message: error.message === 'Failed to fetch' ? 'Unable to reach Meetly. Check that the backend is running.' : error.message })
    } finally {
      setLoading(false)
    }
  }

  const isForgot = mode === 'forgot-password'
  return <main className="auth-page">
    <div className="auth-glow" />
    <a className="auth-brand" href="#top"><Brand /><span>Meetly</span></a>
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card-header">
        <span className="auth-eyebrow">{isForgot ? 'ACCOUNT RECOVERY' : 'WELCOME TO MEETLY'}</span>
        <h1 id="auth-title">{mode === 'signup' ? 'Create your account.' : isForgot ? 'Reset your password.' : 'Welcome back.'}</h1>
        <p>{mode === 'signup' ? 'Start clearer conversations with your team.' : isForgot ? 'Enter your username and we will check for recovery instructions.' : 'Sign in to continue to your meeting workspace.'}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'signup' && <label>Full name<input name="name" value={form.name} onChange={updateField} placeholder="Alex Morgan" autoComplete="name" required /></label>}
        <label>Username<input name="username" value={form.username} onChange={updateField} placeholder="alex.morgan" autoComplete="username" required /></label>
        {!isForgot && <label>Password<input name="password" type="password" value={form.password} onChange={updateField} placeholder="At least 8 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required /></label>}
        {mode === 'signin' && <button className="forgot-link" type="button" onClick={() => changeMode('forgot-password')}>Forgot password?</button>}
        {status.message && <p className={`auth-status ${status.type}`} role="status">{status.message}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : isForgot ? 'Request reset' : 'Sign in'}<span>→</span></button>
      </form>
      <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Meetly?'} <button type="button" onClick={() => changeMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
      {isForgot && <button className="back-link" type="button" onClick={() => changeMode('signin')}>← Back to sign in</button>}
    </section>
    <p className="auth-footer">By continuing, you agree to Meetly's Terms and Privacy Policy.</p>
  </main>
}
