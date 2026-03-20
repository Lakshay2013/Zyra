export interface AuthUser {
  _id: string
  name: string
  email: string
  role: 'admin' | 'member'
  orgId: string
}

export interface AuthOrg {
  _id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  monthlyLogLimit: number
  currentMonthLogs: number
}

const TOKEN_KEY = 'zyra_token'
const USER_KEY  = 'zyra_user'
const ORG_KEY   = 'zyra_org'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getOrg(): AuthOrg | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ORG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setAuth(token: string, user: AuthUser, org: AuthOrg): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(ORG_KEY, JSON.stringify(org))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ORG_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}