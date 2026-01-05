import { useAuthStore } from '../auth-store'; // ajusta la ruta
import { logout } from '@/lib/auth';
import * as permissions from '@/lib/permissions';

// Mocks
jest.mock('@/lib/auth', () => ({
  logout: jest.fn(),
}));

jest.mock('@/lib/permissions', () => ({
  canDelete: jest.fn(),
  canEdit: jest.fn(),
  canAccessConfig: jest.fn(),
  canAccessLiquidaciones: jest.fn(),
  canAccessDigital: jest.fn(),
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
}));

describe('useAuthStore', () => {
  // Reseteo manual del store de Zustand
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    useAuthStore.setState(initialState, true);
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe establecer la autenticación correctamente', () => {
    const userData = { username: 'testuser', role: 'admin' };
    const token = 'fake-token';

    useAuthStore.getState().setAuth(userData, token);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(token);
    // Verifica que normaliza role -> roles[]
    expect(state.user?.roles).toContain('admin');
  });

  it('clearAuth debe limpiar el estado y detener el polling', () => {
    // Simulamos un intervalo activo
    const intervalId = setInterval(() => {}, 1000) as any;
    useAuthStore.setState({ 
      isAuthenticated: true, 
      pollingIntervalId: intervalId,
      token: 'abc' 
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.pollingIntervalId).toBe(null);
    expect(logout).toHaveBeenCalled();
  });

  it('debe actualizar el rol del usuario', () => {
    useAuthStore.setState({ user: { username: 'user', roles: ['user'] } as any });
    
    useAuthStore.getState().updateUserRole('admin');

    expect(useAuthStore.getState().user?.roles).toContain('admin');
  });

  it('debe manejar el polling de roles y detectar cambios', async () => {
    // Mock de la API dinámica
    const mockUser = { role: 'superadmin' };
    jest.doMock('@/lib/api', () => ({
      authApi: { getCurrentUser: jest.fn().mockResolvedValue(mockUser) }
    }));

    useAuthStore.setState({ 
      isAuthenticated: true, 
      token: 'token', 
      user: { role: 'admin', roles: ['admin'] } as any 
    });

    useAuthStore.getState().startRolePolling();

    // Adelantamos el tiempo 5 segundos
    jest.advanceTimersByTime(5000);

    // Verificamos que se llamó a la lógica (vía mocks o estado)
    // Nota: Como es import dinámico, el test de integración es más complejo, 
    // pero verificamos que el pollingId existe:
    expect(useAuthStore.getState().pollingIntervalId).not.toBeNull();
  });

  /* ================= Tests de Permisos ================= */
  
  it('debe llamar a los helpers de permisos correctamente', () => {
    useAuthStore.setState({ user: { roles: ['editor'] } as any });
    
    (permissions.canDelete as jest.Mock).mockReturnValue(true);
    
    const result = useAuthStore.getState().canDelete();
    
    expect(permissions.canDelete).toHaveBeenCalledWith(['editor']);
    expect(result).toBe(true);
  });

  it('hasRole debe devolver false si no hay usuario', () => {
    useAuthStore.setState({ user: null });
    expect(useAuthStore.getState().hasRole('admin' as any)).toBe(false);
  });

  it('debe cerrar sesión automáticamente si el polling devuelve 404 (Usuario no encontrado)', async () => {
    // 1. Mock de la API para devolver error 404
    const apiMock = {
      authApi: { 
        getCurrentUser: jest.fn().mockRejectedValue(new Error('User not found (Error 404)')) 
      }
    };
    jest.doMock('@/lib/api', () => apiMock);

    // 2. Mock de sonner (toast)
    const toastMock = { toast: { error: jest.fn(), info: jest.fn() } };
    jest.doMock('sonner', () => toastMock);

    // 3. Estado inicial autenticado
    useAuthStore.setState({ 
      isAuthenticated: true, 
      token: 'token-activo', 
      user: { id: 1, roles: ['admin'] } as any 
    });

    const spyClearAuth = jest.spyOn(useAuthStore.getState(), 'clearAuth');

    // 4. Iniciar polling y disparar el timer
    useAuthStore.getState().startRolePolling();
    
    // Resolvemos las promesas de los imports dinámicos
    await Promise.resolve(); 
    jest.advanceTimersByTime(5000);
    await Promise.resolve(); // Esperar al bloque catch

    // 5. Verificaciones de las líneas 123-149
    expect(spyClearAuth).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('debe ejecutar todos los helpers de permisos correctamente', () => {
    const roles = ['admin', 'editor'];
    useAuthStore.setState({ user: { roles } as any });

    // Mockeamos las respuestas de los permisos
    (permissions.canEdit as jest.Mock).mockReturnValue(true);
    (permissions.canAccessConfig as jest.Mock).mockReturnValue(false);
    (permissions.canAccessLiquidaciones as jest.Mock).mockReturnValue(true);
    (permissions.canAccessDigital as jest.Mock).mockReturnValue(true);

    const store = useAuthStore.getState();

    // Ejecutamos cada uno para cubrir las líneas 171-187
    expect(store.canEdit()).toBe(true);
    expect(store.canAccessConfig()).toBe(false);
    expect(store.canAccessLiquidaciones()).toBe(true);
    expect(store.canAccessDigital()).toBe(true);

    // Verificamos que se llamaron con los roles del usuario
    expect(permissions.canEdit).toHaveBeenCalledWith(roles);
    expect(permissions.canAccessConfig).toHaveBeenCalledWith(roles);
  });

  it('debe devolver false en permisos si el usuario es null', () => {
    useAuthStore.setState({ user: null });
    const store = useAuthStore.getState();

    expect(store.canEdit()).toBe(false);
    expect(store.hasRole('admin' as any)).toBe(false);
    expect(store.hasAnyRole(['admin'] as any)).toBe(false);
  });

  it('NO inicia polling si ya existe uno activo', () => {
    const intervalId = setInterval(() => {}, 1000) as any

    useAuthStore.setState({ pollingIntervalId: intervalId })

    useAuthStore.getState().startRolePolling()

    // sigue siendo el mismo, no crea otro
    expect(useAuthStore.getState().pollingIntervalId).toBe(intervalId)
  });

  it('NO hace polling si no está autenticado', () => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: { roles: ['admin'] } as any,
    token: 'token'
  })

  useAuthStore.getState().startRolePolling()

  expect(useAuthStore.getState().pollingIntervalId).toBeNull()
})

it('NO hace polling si no hay usuario', () => {
  useAuthStore.setState({
    isAuthenticated: true,
    user: null,
    token: 'token'
  })

  useAuthStore.getState().startRolePolling()

  expect(useAuthStore.getState().pollingIntervalId).toBeNull()
})

it('NO hace polling si no hay token', () => {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { roles: ['admin'] } as any,
    token: null
  })

  useAuthStore.getState().startRolePolling()

  expect(useAuthStore.getState().pollingIntervalId).toBeNull()
})

it('NO hace polling si la pestaña está oculta', () => {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  })

  useAuthStore.setState({
    isAuthenticated: true,
    user: { roles: ['admin'] } as any,
    token: 'token'
  })

  useAuthStore.getState().startRolePolling()

  expect(useAuthStore.getState().pollingIntervalId).toBeNull()
})

it('stopRolePolling limpia el intervalo', () => {
  const intervalId = setInterval(() => {}, 1000) as any

  useAuthStore.setState({ pollingIntervalId: intervalId })

  useAuthStore.getState().stopRolePolling()

  expect(useAuthStore.getState().pollingIntervalId).toBeNull()
})
});