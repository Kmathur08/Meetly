import { useState } from 'react'
import './authentication.css'
import Brand from '../components/Brand'
import { api, setToken } from '../lib/api'

const COPY = {
  signin: { eyebrow: 'WELCOME TO MEETLY', title: 'Welcome back.', text: 'Sign in to continue to your meeting workspace.', submit: 'Sign in' },
  signup: { eyebrow: 'WELCOME TO MEETLY', title: 'Create your account.', text: 'Start clearer conversations with your team.', submit: 'Create account' },
  'forgot-password': { eyebrow: 'ACCOUNT RECOVERY', title: 'Reset your password.', text: 'Enter your username or email and we’ll email you a link to choose a new password.', submit: 'Email me a reset link' },
  'reset-password': { eyebrow: 'ACCOUNT RECOVERY', title: 'Choose a new password.', text: 'Pick a password with at least 8 characters. You’ll be signed out everywhere else.', submit: 'Save new password' },
}

export default function Authentication({ initialMode = 'signin', resetToken = '' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', account: '', confirm: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const changeMode = (nextMode) => {
    setMode(nextMode)
    setStatus({ type: '', message: '' })
    window.history.replaceState(null, '', `#${nextMode}`)
  }

  const request = () => {
    if (mode === 'signin') return ['login', { username: form.username, password: form.password }]
    if (mode === 'signup') return ['register', { name: form.name, email: form.email, username: form.username, password: form.password }]
    if (mode === 'forgot-password') return ['forgot-password', { account: form.account }]
    return ['reset-password', { token: resetToken, password: form.password }]
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if ((mode === 'signup' || mode === 'reset-password') && form.password.length < 8) {
      setStatus({ type: 'error', message: 'Your password must be at least 8 characters.' })
      return
    }
    if (mode === 'reset-password' && form.password !== form.confirm) {
      setStatus({ type: 'error', message: 'The two passwords don’t match.' })
      return
    }

    setLoading(true)
    const [endpoint, body] = request()
    try {
      const data = await api(endpoint, { method: 'POST', body, auth: false })

      if (mode === 'signin' && data.token) {
        setToken(data.token)
        // Send people back to the meeting link they opened before signing in.
        const next = sessionStorage.getItem('meetly_next')
        sessionStorage.removeItem('meetly_next')
        window.location.hash = next || 'home'
        return
      }
      setStatus({ type: 'success', message: data.message || 'Welcome to Meetly.' })
      if (mode === 'signup') window.setTimeout(() => changeMode('signin'), 900)
      // The link is single-use, so move on to sign-in and keep the success message visible there.
      if (mode === 'reset-password') {
        setMode('signin')
        setForm((current) => ({ ...current, password: '', confirm: '' }))
        window.history.replaceState(null, '', '#signin')
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const copy = COPY[mode]
  const isRecovery = mode === 'forgot-password' || mode === 'reset-password'
  return <main className="auth-page">
    <div className="auth-glow" />
    <a className="auth-brand" href="#top"><Brand /><span>Meetly</span></a>
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card-header">
        <span className="auth-eyebrow">{copy.eyebrow}</span>
        <h1 id="auth-title">{copy.title}</h1>
        <p>{copy.text}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'signup' && <label>Full name<input name="name" value={form.name} onChange={updateField} placeholder="Alex Morgan" autoComplete="name" required /></label>}
        {mode === 'signup' && <label>Email<input name="email" type="email" value={form.email} onChange={updateField} placeholder="alex@example.com" autoComplete="email" required /><small className="auth-hint">Only used to reset your password.</small></label>}
        {(mode === 'signin' || mode === 'signup') && <label>Username<input name="username" value={form.username} onChange={updateField} placeholder="alex.morgan" autoComplete="username" required /></label>}
        {mode === 'forgot-password' && <label>Username or email<input name="account" value={form.account} onChange={updateField} placeholder="alex.morgan or alex@example.com" autoComplete="username" required /></label>}
        {mode !== 'forgot-password' && <label>{mode === 'reset-password' ? 'New password' : 'Password'}<input name="password" type="password" value={form.password} onChange={updateField} placeholder="At least 8 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signin' ? undefined : 8} required /></label>}
        {mode === 'reset-password' && <label>Confirm new password<input name="confirm" type="password" value={form.confirm} onChange={updateField} autoComplete="new-password" minLength={8} required /></label>}
        {mode === 'signin' && <button className="forgot-link" type="button" onClick={() => changeMode('forgot-password')}>Forgot password?</button>}
        {status.message && <p className={`auth-status ${status.type}`} role="status">{status.message}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait...' : copy.submit}<span>→</span></button>
      </form>
      {mode === 'forgot-password' && <p className="auth-note">Older accounts may not have an email yet. Sign in and add one from your workspace so you can recover it later.</p>}
      {!isRecovery && <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Meetly?'} <button type="button" onClick={() => changeMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>}
      {isRecovery && <button className="back-link" type="button" onClick={() => changeMode('signin')}>← Back to sign in</button>}
    </section>
    <p className="auth-footer">By continuing, you agree to Meetly's Terms and Privacy Policy.</p>
  </main>
}
