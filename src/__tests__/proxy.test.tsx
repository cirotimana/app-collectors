import { proxy } from "../proxy"
import { NextResponse } from "next/server"

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ type: 'redirect', url })),
    next: jest.fn(() => ({ type: 'next' })),
  },
}))

const mockNextResponseRedirect = NextResponse.redirect as jest.Mock
const mockNextResponseNext = NextResponse.next as jest.Mock

function createRequest({
  token,
  pathname = "/dashboard",
}: {
  token?: string
  pathname?: string
}) {
  return {
    cookies: {
      get: jest.fn(() =>
        token ? { value: token } : undefined
      ),
    },
    nextUrl: {
      pathname,
    },
    url: "http://localhost:3000" + pathname,
  } as any
}

describe("proxy middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("redirige a /auth/login si NO hay token y la ruta está protegida", () => {
    const request = createRequest({ token: undefined })

    proxy(request)

    expect(mockNextResponseRedirect).toHaveBeenCalled()
    expect(mockNextResponseRedirect.mock.calls[0][0].toString()).toContain(
      "/auth/login"
    )
  })

  it("permite continuar si hay token", () => {
    const request = createRequest({ token: "jwt-token" })

    const response = proxy(request)

    expect(mockNextResponseNext).toHaveBeenCalled()
    expect(response).toBeDefined()
  })

  it("permite acceder a /auth/login sin token", () => {
    const request = createRequest({
      token: undefined,
      pathname: "/auth/login",
    })

    proxy(request)

    expect(mockNextResponseNext).toHaveBeenCalled()
  })

  it("permite acceder a /forbidden sin token", () => {
    const request = createRequest({
      token: undefined,
      pathname: "/forbidden",
    })

    proxy(request)

    expect(mockNextResponseNext).toHaveBeenCalled()
  })
})
