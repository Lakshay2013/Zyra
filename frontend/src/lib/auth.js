export const getToken = () => localStorage.getItem('token')
export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null')
export const getOrg = () => JSON.parse(localStorage.getItem('org') || 'null')

export const setAuth = (token, user, org) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('org', JSON.stringify(org))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('org')
}

export const isAuthenticated = () => !!getToken()