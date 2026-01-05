import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../theme-provider'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Mock de next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: jest.fn(({ children }) => <div data-testid="next-themes-provider">{children}</div>),
}))

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ================= Renderizado básico ================= */

  it('renderiza correctamente con children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('envuelve children con NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  /* ================= Props forwarding ================= */

  it('pasa todas las props a NextThemesProvider', () => {
    const props = {
      attribute: 'class',
      defaultTheme: 'system',
      enableSystem: true,
      disableTransitionOnChange: true,
    }

    render(
      <ThemeProvider {...props}>
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.attribute).toBe('class')
    expect(mockCalls.defaultTheme).toBe('system')
    expect(mockCalls.enableSystem).toBe(true)
    expect(mockCalls.disableTransitionOnChange).toBe(true)
  })

  it('pasa prop attribute correctamente', () => {
    render(
      <ThemeProvider attribute="data-theme">
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.attribute).toBe('data-theme')
  })

  it('pasa prop defaultTheme correctamente', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.defaultTheme).toBe('dark')
  })

  it('pasa prop enableSystem correctamente', () => {
    render(
      <ThemeProvider enableSystem={false}>
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.enableSystem).toBe(false)
  })

  it('pasa prop storageKey correctamente', () => {
    render(
      <ThemeProvider storageKey="my-theme">
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.storageKey).toBe('my-theme')
  })

  /* ================= Multiple children ================= */

  it('renderiza múltiples children correctamente', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
        <div data-testid="child-3">Third Child</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
  })

  /* ================= Nested components ================= */

  it('renderiza componentes anidados correctamente', () => {
    const NestedComponent = () => (
      <div data-testid="nested">
        <span>Nested Content</span>
      </div>
    )

    render(
      <ThemeProvider>
        <NestedComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('nested')).toBeInTheDocument()
    expect(screen.getByText('Nested Content')).toBeInTheDocument()
  })

  /* ================= Props combination ================= */

  it('maneja combinación de múltiples props', () => {
    const complexProps = {
      attribute: 'class',
      defaultTheme: 'light',
      enableSystem: true,
      disableTransitionOnChange: true,
      storageKey: 'app-theme',
      themes: ['light', 'dark', 'blue'],
    }

    render(
      <ThemeProvider {...complexProps}>
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.attribute).toBe('class')
    expect(mockCalls.defaultTheme).toBe('light')
    expect(mockCalls.enableSystem).toBe(true)
    expect(mockCalls.disableTransitionOnChange).toBe(true)
    expect(mockCalls.storageKey).toBe('app-theme')
    expect(mockCalls.themes).toEqual(['light', 'dark', 'blue'])
  })

  /* ================= TypeScript type safety ================= */

  it('acepta todas las props válidas de NextThemesProvider', () => {
    // Este test verifica que el componente acepta todas las props válidas
    const validProps = {
      attribute: 'class' as const,
      defaultTheme: 'system',
      enableSystem: true,
      enableColorScheme: true,
      disableTransitionOnChange: false,
      storageKey: 'theme',
      themes: ['light', 'dark'],
      forcedTheme: 'light',
      nonce: 'random-nonce',
    }

    render(
      <ThemeProvider {...validProps}>
        <div>Test</div>
      </ThemeProvider>
    )

    const mockCalls = (NextThemesProvider as jest.Mock).mock.calls[0][0]
    expect(mockCalls.attribute).toBe('class')
    expect(mockCalls.defaultTheme).toBe('system')
    expect(mockCalls.enableSystem).toBe(true)
    expect(mockCalls.storageKey).toBe('theme')
  })

  /* ================= Edge cases ================= */

  it('renderiza sin children', () => {
    render(<ThemeProvider />)

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  it('renderiza con children null', () => {
    render(<ThemeProvider>{null}</ThemeProvider>)

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  it('renderiza con children undefined', () => {
    render(<ThemeProvider>{undefined}</ThemeProvider>)

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
  })

  it('renderiza con string como children', () => {
    render(<ThemeProvider>Plain text content</ThemeProvider>)

    expect(screen.getByText('Plain text content')).toBeInTheDocument()
  })

  it('renderiza con número como children', () => {
    render(<ThemeProvider>{42}</ThemeProvider>)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renderiza con array de children', () => {
    render(
      <ThemeProvider>
        {['First', 'Second', 'Third'].map((text, i) => (
          <div key={i} data-testid={`item-${i}`}>
            {text}
          </div>
        ))}
      </ThemeProvider>
    )

    expect(screen.getByTestId('item-0')).toHaveTextContent('First')
    expect(screen.getByTestId('item-1')).toHaveTextContent('Second')
    expect(screen.getByTestId('item-2')).toHaveTextContent('Third')
  })

  /* ================= Re-rendering ================= */

  it('mantiene children al re-renderizar', () => {
    const { rerender } = render(
      <ThemeProvider defaultTheme="light">
        <div data-testid="child">Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()

    rerender(
      <ThemeProvider defaultTheme="dark">
        <div data-testid="child">Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('actualiza children al re-renderizar', () => {
    const { rerender } = render(
      <ThemeProvider>
        <div data-testid="child">Original</div>
      </ThemeProvider>
    )

    expect(screen.getByText('Original')).toBeInTheDocument()

    rerender(
      <ThemeProvider>
        <div data-testid="child">Updated</div>
      </ThemeProvider>
    )

    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.queryByText('Original')).not.toBeInTheDocument()
  })

  /* ================= Integration ================= */

  it('puede ser anidado dentro de otros providers', () => {
    const OtherProvider = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="other-provider">{children}</div>
    )

    render(
      <OtherProvider>
        <ThemeProvider>
          <div data-testid="content">Content</div>
        </ThemeProvider>
      </OtherProvider>
    )

    expect(screen.getByTestId('other-provider')).toBeInTheDocument()
    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('mantiene el orden de los providers anidados', () => {
    render(
      <div data-testid="root">
        <ThemeProvider>
          <div data-testid="theme-child">
            <div data-testid="nested-content">Deep nested</div>
          </div>
        </ThemeProvider>
      </div>
    )

    const root = screen.getByTestId('root')
    const themeProvider = screen.getByTestId('next-themes-provider')
    const themeChild = screen.getByTestId('theme-child')
    const nestedContent = screen.getByTestId('nested-content')

    expect(root).toContainElement(themeProvider)
    expect(themeProvider).toContainElement(themeChild)
    expect(themeChild).toContainElement(nestedContent)
  })
})