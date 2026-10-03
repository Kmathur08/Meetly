const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'meetly_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError('Unable to reach Meetly. Check your connection and try again.', 0)
  }

  const data = await response.json().catch(() => ({}))
  if (response.status === 401 && auth) clearToken()
  if (!response.ok) throw new ApiError(data.message || 'Something went wrong. Please try again.', response.status)
  return data
}
