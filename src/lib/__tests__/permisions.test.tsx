import {
  ROLES,
  ROLE_PERMISSIONS,
  PROTECTED_ROUTES,
  canAccessRoute,
  canDelete,
  canEdit,
  canAccessConfig,
  canAccessLiquidaciones,
  canAccessDigital,
  hasRole,
  hasAnyRole,
} from '../permissions'

describe('Permissions module', () => {
  /* ================= Constantes ================= */
  describe('ROLES', () => {
    it('tiene todos los roles definidos', () => {
      expect(ROLES.ADMINISTRATOR).toBe('administrator')
      expect(ROLES.ANALISTA_TESORERIA).toBe('analista_tesoreria')
      expect(ROLES.ANALISTA_SOPORTE).toBe('analista_soporte')
      expect(ROLES.ANALISTA).toBe('analista')
    })
  })

  describe('ROLE_PERMISSIONS', () => {
    it('administrator tiene todos los permisos', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ADMINISTRATOR]
      expect(perms.canDelete).toBe(true)
      expect(perms.canEdit).toBe(true)
      expect(perms.canAccessConfig).toBe(true)
      expect(perms.canAccessLiquidaciones).toBe(true)
      expect(perms.canAccessAll).toBe(true)
    })

    it('analista_tesoreria tiene permisos limitados', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ANALISTA_TESORERIA]
      expect(perms.canDelete).toBe(false)
      expect(perms.canEdit).toBe(true)
      expect(perms.canAccessConfig).toBe(false)
      expect(perms.canAccessLiquidaciones).toBe(true)
      expect(perms.canAccessAll).toBe(false)
    })

    it('analista_soporte solo tiene permisos de lectura', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ANALISTA_SOPORTE]
      expect(perms.canDelete).toBe(false)
      expect(perms.canEdit).toBe(false)
      expect(perms.canAccessConfig).toBe(false)
      expect(perms.canAccessLiquidaciones).toBe(false)
      expect(perms.canAccessAll).toBe(false)
    })

    it('analista solo tiene permisos de lectura', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ANALISTA]
      expect(perms.canDelete).toBe(false)
      expect(perms.canEdit).toBe(false)
      expect(perms.canAccessConfig).toBe(false)
      expect(perms.canAccessLiquidaciones).toBe(false)
      expect(perms.canAccessAll).toBe(false)
    })
  })

  describe('PROTECTED_ROUTES', () => {
    it('solo administrator puede acceder a configuration', () => {
      expect(PROTECTED_ROUTES['/configuration']).toEqual([ROLES.ADMINISTRATOR])
    })

    it('administrator y analista_tesoreria pueden acceder a dashboard', () => {
      expect(PROTECTED_ROUTES['/dashboard']).toEqual([
        ROLES.ADMINISTRATOR,
        ROLES.ANALISTA_TESORERIA,
      ])
    })

    it('todos los roles pueden acceder a reports', () => {
      expect(PROTECTED_ROUTES['/reports']).toEqual([
        ROLES.ADMINISTRATOR,
        ROLES.ANALISTA_TESORERIA,
        ROLES.ANALISTA_SOPORTE,
        ROLES.ANALISTA,
      ])
    })
  })

  /* ================= canAccessRoute ================= */
  describe('canAccessRoute', () => {
    it('administrator puede acceder a cualquier ruta', () => {
      expect(canAccessRoute([ROLES.ADMINISTRATOR], '/configuration')).toBe(true)
      expect(canAccessRoute([ROLES.ADMINISTRATOR], '/dashboard')).toBe(true)
      expect(canAccessRoute([ROLES.ADMINISTRATOR], '/reports')).toBe(true)
      expect(canAccessRoute([ROLES.ADMINISTRATOR], '/any-route')).toBe(true)
    })

    it('analista_tesoreria puede acceder a dashboard', () => {
      expect(canAccessRoute([ROLES.ANALISTA_TESORERIA], '/dashboard')).toBe(true)
    })

    it('analista_tesoreria NO puede acceder a configuration', () => {
      expect(canAccessRoute([ROLES.ANALISTA_TESORERIA], '/configuration')).toBe(false)
    })

    it('analista puede acceder a reports', () => {
      expect(canAccessRoute([ROLES.ANALISTA], '/reports')).toBe(true)
    })

    it('analista puede acceder a digital', () => {
      expect(canAccessRoute([ROLES.ANALISTA], '/digital')).toBe(true)
    })

    it('analista NO puede acceder a dashboard', () => {
      expect(canAccessRoute([ROLES.ANALISTA], '/dashboard')).toBe(false)
    })

    it('retorna true para rutas no protegidas', () => {
      expect(canAccessRoute([ROLES.ANALISTA], '/some-public-route')).toBe(true)
    })

    it('busca la ruta más específica que coincida', () => {
      // /configuration/users es más específica que /configuration
      expect(canAccessRoute([ROLES.ADMINISTRATOR], '/configuration/users')).toBe(true)
      expect(canAccessRoute([ROLES.ANALISTA], '/configuration/users')).toBe(false)
    })

    it('retorna false si userRoles es null o undefined', () => {
      expect(canAccessRoute(null as any, '/dashboard')).toBe(false)
      expect(canAccessRoute(undefined as any, '/dashboard')).toBe(false)
    })

    it('retorna false si userRoles no es un array', () => {
      expect(canAccessRoute('not-an-array' as any, '/dashboard')).toBe(false)
    })

    it('permite acceso si el usuario tiene múltiples roles y uno es válido', () => {
      expect(canAccessRoute([ROLES.ANALISTA, ROLES.ADMINISTRATOR], '/configuration')).toBe(true)
    })
  })

  /* ================= canDelete ================= */
  describe('canDelete', () => {
    it('administrator puede eliminar', () => {
      expect(canDelete([ROLES.ADMINISTRATOR])).toBe(true)
    })

    it('analista_tesoreria NO puede eliminar', () => {
      expect(canDelete([ROLES.ANALISTA_TESORERIA])).toBe(false)
    })

    it('analista_soporte NO puede eliminar', () => {
      expect(canDelete([ROLES.ANALISTA_SOPORTE])).toBe(false)
    })

    it('analista NO puede eliminar', () => {
      expect(canDelete([ROLES.ANALISTA])).toBe(false)
    })

    it('retorna false si userRoles es null', () => {
      expect(canDelete(null as any)).toBe(false)
    })

    it('retorna false si userRoles no es un array', () => {
      expect(canDelete('not-an-array' as any)).toBe(false)
    })

    it('retorna false para roles desconocidos', () => {
      expect(canDelete(['unknown_role'])).toBe(false)
    })
  })

  /* ================= canEdit ================= */
  describe('canEdit', () => {
    it('administrator puede editar', () => {
      expect(canEdit([ROLES.ADMINISTRATOR])).toBe(true)
    })

    it('analista_tesoreria puede editar', () => {
      expect(canEdit([ROLES.ANALISTA_TESORERIA])).toBe(true)
    })

    it('analista_soporte NO puede editar', () => {
      expect(canEdit([ROLES.ANALISTA_SOPORTE])).toBe(false)
    })

    it('analista NO puede editar', () => {
      expect(canEdit([ROLES.ANALISTA])).toBe(false)
    })

    it('retorna false si userRoles es null', () => {
      expect(canEdit(null as any)).toBe(false)
    })

    it('retorna true si tiene al menos un rol con permiso de edición', () => {
      expect(canEdit([ROLES.ANALISTA, ROLES.ANALISTA_TESORERIA])).toBe(true)
    })
  })

  /* ================= canAccessConfig ================= */
  describe('canAccessConfig', () => {
    it('administrator puede acceder a configuración', () => {
      expect(canAccessConfig([ROLES.ADMINISTRATOR])).toBe(true)
    })

    it('analista_tesoreria NO puede acceder a configuración', () => {
      expect(canAccessConfig([ROLES.ANALISTA_TESORERIA])).toBe(false)
    })

    it('analista_soporte NO puede acceder a configuración', () => {
      expect(canAccessConfig([ROLES.ANALISTA_SOPORTE])).toBe(false)
    })

    it('analista NO puede acceder a configuración', () => {
      expect(canAccessConfig([ROLES.ANALISTA])).toBe(false)
    })

    it('retorna false si userRoles es undefined', () => {
      expect(canAccessConfig(undefined as any)).toBe(false)
    })
  })

  /* ================= canAccessLiquidaciones ================= */
  describe('canAccessLiquidaciones', () => {
    it('administrator puede acceder a liquidaciones', () => {
      expect(canAccessLiquidaciones([ROLES.ADMINISTRATOR])).toBe(true)
    })

    it('analista_tesoreria puede acceder a liquidaciones', () => {
      expect(canAccessLiquidaciones([ROLES.ANALISTA_TESORERIA])).toBe(true)
    })

    it('analista_soporte NO puede acceder a liquidaciones', () => {
      expect(canAccessLiquidaciones([ROLES.ANALISTA_SOPORTE])).toBe(false)
    })

    it('analista NO puede acceder a liquidaciones', () => {
      expect(canAccessLiquidaciones([ROLES.ANALISTA])).toBe(false)
    })

    it('retorna false para array vacío', () => {
      expect(canAccessLiquidaciones([])).toBe(false)
    })
  })

  /* ================= canAccessDigital ================= */
  describe('canAccessDigital', () => {
    it('administrator puede acceder a digital', () => {
      expect(canAccessDigital([ROLES.ADMINISTRATOR])).toBe(true)
    })

    it('analista puede acceder a digital', () => {
      expect(canAccessDigital([ROLES.ANALISTA])).toBe(true)
    })

    it('analista_tesoreria NO puede acceder a digital', () => {
      expect(canAccessDigital([ROLES.ANALISTA_TESORERIA])).toBe(false)
    })

    it('analista_soporte NO puede acceder a digital', () => {
      expect(canAccessDigital([ROLES.ANALISTA_SOPORTE])).toBe(false)
    })

    it('retorna false si userRoles es null', () => {
      expect(canAccessDigital(null as any)).toBe(false)
    })

    it('retorna true si tiene al menos uno de los roles permitidos', () => {
      expect(canAccessDigital([ROLES.ANALISTA_SOPORTE, ROLES.ANALISTA])).toBe(true)
    })
  })

  /* ================= hasRole ================= */
  describe('hasRole', () => {
    it('retorna true si el usuario tiene el rol especificado', () => {
      expect(hasRole([ROLES.ADMINISTRATOR], ROLES.ADMINISTRATOR)).toBe(true)
      expect(hasRole([ROLES.ANALISTA], ROLES.ANALISTA)).toBe(true)
    })

    it('retorna false si el usuario NO tiene el rol', () => {
      expect(hasRole([ROLES.ANALISTA], ROLES.ADMINISTRATOR)).toBe(false)
    })

    it('retorna true si tiene el rol entre múltiples roles', () => {
      expect(hasRole([ROLES.ANALISTA, ROLES.ADMINISTRATOR], ROLES.ADMINISTRATOR)).toBe(true)
    })

    it('retorna false si userRoles es null', () => {
      expect(hasRole(null as any, ROLES.ADMINISTRATOR)).toBe(false)
    })

    it('retorna false si userRoles no es un array', () => {
      expect(hasRole('not-array' as any, ROLES.ADMINISTRATOR)).toBe(false)
    })

    it('retorna false para array vacío', () => {
      expect(hasRole([], ROLES.ADMINISTRATOR)).toBe(false)
    })
  })

  /* ================= hasAnyRole ================= */
  describe('hasAnyRole', () => {
    it('retorna true si tiene alguno de los roles especificados', () => {
      expect(hasAnyRole([ROLES.ADMINISTRATOR], [ROLES.ADMINISTRATOR, ROLES.ANALISTA])).toBe(true)
      expect(hasAnyRole([ROLES.ANALISTA], [ROLES.ADMINISTRATOR, ROLES.ANALISTA])).toBe(true)
    })

    it('retorna false si NO tiene ninguno de los roles', () => {
      expect(hasAnyRole([ROLES.ANALISTA_SOPORTE], [ROLES.ADMINISTRATOR, ROLES.ANALISTA])).toBe(false)
    })

    it('retorna true si tiene al menos un rol de la lista', () => {
      expect(
        hasAnyRole(
          [ROLES.ANALISTA_SOPORTE, ROLES.ADMINISTRATOR],
          [ROLES.ADMINISTRATOR, ROLES.ANALISTA]
        )
      ).toBe(true)
    })

    it('retorna false si userRoles es null', () => {
      expect(hasAnyRole(null as any, [ROLES.ADMINISTRATOR])).toBe(false)
    })

    it('retorna false si userRoles no es un array', () => {
      expect(hasAnyRole('not-array' as any, [ROLES.ADMINISTRATOR])).toBe(false)
    })

    it('retorna false para array vacío de userRoles', () => {
      expect(hasAnyRole([], [ROLES.ADMINISTRATOR])).toBe(false)
    })

    it('retorna false para array vacío de roles a verificar', () => {
      expect(hasAnyRole([ROLES.ADMINISTRATOR], [])).toBe(false)
    })

    it('maneja múltiples roles correctamente', () => {
      expect(
        hasAnyRole(
          [ROLES.ANALISTA_TESORERIA, ROLES.ANALISTA_SOPORTE],
          [ROLES.ANALISTA_TESORERIA, ROLES.ADMINISTRATOR]
        )
      ).toBe(true)
    })
  })

  /* ================= Casos Edge ================= */
  describe('Edge cases', () => {
    it('maneja arrays vacíos correctamente', () => {
      expect(canAccessRoute([], '/dashboard')).toBe(false)
      expect(canDelete([])).toBe(false)
      expect(canEdit([])).toBe(false)
      expect(canAccessConfig([])).toBe(false)
      expect(canAccessLiquidaciones([])).toBe(false)
      expect(canAccessDigital([])).toBe(false)
    })

    it('maneja roles desconocidos correctamente', () => {
      expect(canDelete(['unknown_role'])).toBe(false)
      expect(canEdit(['unknown_role'])).toBe(false)
      expect(canAccessConfig(['unknown_role'])).toBe(false)
    })

    it('canAccessRoute permite rutas no protegidas sin importar el rol', () => {
      expect(canAccessRoute(['unknown_role'], '/unprotected-route')).toBe(true)
      expect(canAccessRoute([], '/unprotected-route')).toBe(true)
    })

    it('múltiples roles dan el permiso más alto', () => {
      const multipleRoles = [ROLES.ANALISTA, ROLES.ADMINISTRATOR]
      expect(canDelete(multipleRoles)).toBe(true)
      expect(canEdit(multipleRoles)).toBe(true)
      expect(canAccessConfig(multipleRoles)).toBe(true)
    })
  })
})