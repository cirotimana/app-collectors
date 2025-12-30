// constantes de roles
export const ROLES = {
  ADMINISTRATOR: "administrator",
  ANALISTA_TESORERIA: "analista_tesoreria",
  ANALISTA_SOPORTE: "analista_soporte",
  ANALISTA: "analista",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// permisos por rol
export const ROLE_PERMISSIONS = {
  [ROLES.ADMINISTRATOR]: {
    canDelete: true,
    canEdit: true,
    canAccessConfig: true,
    canAccessLiquidaciones: true,
    canAccessAll: true,
  },
  [ROLES.ANALISTA_TESORERIA]: {
    canDelete: false,
    canEdit: true,
    canAccessConfig: false,
    canAccessLiquidaciones: true,
    canAccessAll: false,
  },
  [ROLES.ANALISTA_SOPORTE]: {
    canDelete: false,
    canEdit: false,
    canAccessConfig: false,
    canAccessLiquidaciones: false,
    canAccessAll: false,
  },
  [ROLES.ANALISTA]: {
    canDelete: false,
    canEdit: false,
    canAccessConfig: false,
    canAccessLiquidaciones: false,
    canAccessAll: false,
  },
} as const;

// rutas protegidas y roles permitidos
export const PROTECTED_ROUTES = {
  "/configuration": [ROLES.ADMINISTRATOR],
  "/configuration/users": [ROLES.ADMINISTRATOR],
  "/configuration/roles": [ROLES.ADMINISTRATOR],
  "/dashboard": [ROLES.ADMINISTRATOR, ROLES.ANALISTA_TESORERIA],
  "/dashboard/sales": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/reports": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/records": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/summary": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/download": [ROLES.ADMINISTRATOR],
  "/digital": [ROLES.ADMINISTRATOR, ROLES.ANALISTA],
  "/process": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/process/updated": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/history": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
  "/history/executions": [
    ROLES.ADMINISTRATOR,
    ROLES.ANALISTA_TESORERIA,
    ROLES.ANALISTA_SOPORTE,
    ROLES.ANALISTA,
  ],
} as const;

// verificar si un rol puede acceder a una ruta
export function canAccessRoute(userRoles: string[], path: string): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;

  // administrador tiene acceso a todo
  if (userRoles.includes(ROLES.ADMINISTRATOR)) {
    return true;
  }

  // buscar la ruta mas especifica que coincida
  const matchingRoute = Object.keys(PROTECTED_ROUTES)
    .filter((route) => path.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchingRoute) {
    return true; // ruta no protegida
  }

  const allowedRoles = PROTECTED_ROUTES[
    matchingRoute as keyof typeof PROTECTED_ROUTES
  ] as readonly Role[];
  return userRoles.some((role) => allowedRoles.includes(role as Role));
}

// verificar si un rol puede eliminar
export function canDelete(userRoles: string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role as Role];
    return permissions?.canDelete ?? false;
  });
}

// verificar si un rol puede editar
export function canEdit(userRoles: string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role as Role];
    return permissions?.canEdit ?? false;
  });
}

// verificar si un rol puede acceder a configuracion
export function canAccessConfig(userRoles: string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role as Role];
    return permissions?.canAccessConfig ?? false;
  });
}

// verificar si un rol puede acceder a liquidaciones
export function canAccessLiquidaciones(userRoles: string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role as Role];
    return permissions?.canAccessLiquidaciones ?? false;
  });
}

// verificar si un rol puede acceder al modulo digital
export function canAccessDigital(userRoles: string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return (
    userRoles.includes(ROLES.ADMINISTRATOR) ||
    userRoles.includes(ROLES.ANALISTA)
  );
}

// verificar si tiene un rol especifico
export function hasRole(userRoles: string[], role: Role): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(role);
}

// verificar si tiene alguno de los roles especificados
export function hasAnyRole(userRoles: string[], roles: Role[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return roles.some((role) => userRoles.includes(role));
}
