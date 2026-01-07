import {
  login,
  logout,
  getToken,
  setToken,
  getUser,
  setUser,
  isAuthenticated,
} from '../auth'

const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    document.cookie = ''
  })

  /* ================= login ================= */
  it('login guarda token y user correctamente', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          access_token: 'token123',
          user: {
            id: 1,
            username: 'leo',
            role: 'ADMIN',
          },
        },
      }),
    })

    const result = await login({
      username: 'leo',
      password: '123',
    })

    expect(result.access_token).toBe('token123')
    expect(result.user.roles).toEqual(['ADMIN'])

    expect(localStorage.getItem('auth_token')).toBe('token123')
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toMatchObject({
      username: 'leo',
      roles: ['ADMIN'],
    })
  })

  it('login lanza error si response no es ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Credenciales invalidas',
      }),
    })

    await expect(
      login({ username: 'leo', password: 'bad' })
    ).rejects.toThrow('Credenciales invalidas')
  })

  it('login lanza error si success=false', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        message: 'Usuario desactivado',
      }),
    })

    await expect(
      login({ username: 'leo', password: '123' })
    ).rejects.toThrow('Usuario desactivado')
  })

  it('login normaliza roles cuando solo viene role', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          access_token: 'token123',
          user: {
            username: 'leo',
            role: 'USER',
          },
        },
      }),
    })

    const res = await login({ username: 'leo', password: '123' })

    expect(res.user.roles).toEqual(['USER'])
  })

  /* ================= token ================= */

  it('setToken y getToken funcionan', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  /* ================= user ================= */

  it('setUser y getUser funcionan', () => {
    const user = { username: 'leo', roles: ['ADMIN'] }
    setUser(user)

    expect(getUser()).toMatchObject(user)
  })

  it('getUser devuelve null si JSON es invalido', () => {
    localStorage.setItem('auth_user', 'bad-json')
    expect(getUser()).toBeNull()
  })

  /* ================= logout ================= */

  it('logout limpia localStorage y cookie', () => {
    setToken('token')
    setUser({ username: 'leo', roles: [] })

    logout()

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })

  /* ================= isAuthenticated ================= */

  it('isAuthenticated es true si hay token y user', () => {
    setToken('token')
    setUser({ username: 'leo', roles: [] })

    expect(isAuthenticated()).toBe(true)
  })

  it('isAuthenticated es false si falta token o user', () => {
    setToken('token')
    expect(isAuthenticated()).toBe(false)

    localStorage.clear()
    setUser({ username: 'leo', roles: [] })
    expect(isAuthenticated()).toBe(false)
  })
})
