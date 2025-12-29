"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Logo from "../../assets/img/logo.jpg";
import { Server, CloudDownload, Gpu, LayoutDashboard, BookText, History, PieChart, Database, BarChart3, TrendingUp, ChevronRight, RefreshCw, Activity, Settings, Users, Shield } from "lucide-react";
import { ModeToggle } from "@/components/provider/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/store/auth-store";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const menuItems = [
  { icon: <TrendingUp />, label: "Dashboard Ventas", href: "/dashboard-ventas" },
  { icon: <LayoutDashboard  />, label: "Dashboard Liquidaciones", href: "/dashboard", requireLiquidaciones: true },
  { icon: <PieChart />, label: "Reportes", href: "/reportes" },
  { icon: <Database />, label: "Registros", href: "/registros" },
  { icon: <BookText  />, label: "Resumen", href: "/resumen" },
  { icon: <CloudDownload />, label: "Descargas", href: "/download", requireAdmin: true },
  { icon: <Gpu />, label: "Digital", href: "/digital", requireDigital: true },
];

const processItems = [
  { icon: <Activity />, label: "Conciliacion", href: "/process" },
  { icon: <RefreshCw />, label: "Actualizacion", href: "/process/actualizacion" },
];

const historicoItems = [
  { icon: <History />, label: "Discrepancias", href: "/historico" },
  { icon: <BarChart3 />, label: "Ejecuciones", href: "/historico/ejecuciones" },
];

const configuracionItems = [
  { icon: <Users />, label: "Usuarios", href: "/configuracion/usuarios" },
  { icon: <Shield />, label: "Roles", href: "/configuracion/roles" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { canAccessConfig, canAccessLiquidaciones, canAccessDigital } = useAuthStore();

  // filtrar items del menu segun permisos
  const visibleMenuItems = menuItems.filter(item => {
    if (item.requireLiquidaciones) {
      return canAccessLiquidaciones()
    }
    if (item.requireAdmin) {
      return canAccessConfig()
    }
    if (item.requireDigital) {
      return canAccessDigital()
    }
    return true
  })

  // mostrar configuracion solo si tiene permiso
  const showConfiguracion = canAccessConfig()

  // funcion para obtener las iniciales del usuario
  const getUserInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={Logo.src} alt="Logo Apuesta Total" />
            <AvatarFallback className="bg-red-600 text-white font-bold">
              AT
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-black text-gray-900">
              Apuesta <span className="text-red-600">Total</span>
            </h1>
            <p className="text-xs text-gray-600">
              Plataforma de Tesoreria
            </p>
          </div>  
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "text-sm font-semibold",
                      pathname === item.href &&
                        "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    <Link href={item.href}>
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Submenu Procesos */}
              <Collapsible>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-sm font-semibold">
                      <Server className="text-lg mr-2" />
                      <span>Procesos</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {processItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                            className={cn(
                              "text-sm",
                              pathname === item.href &&
                                "bg-red-600 text-white hover:bg-red-700"
                            )}
                          >
                            <Link href={item.href}>
                              <span className="mr-2">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Submenu Historico */}
              <Collapsible>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-sm font-semibold">
                      <History className="text-lg mr-2" />
                      <span>Histórico</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {historicoItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                            className={cn(
                              "text-sm",
                              pathname === item.href &&
                                "bg-red-600 text-white hover:bg-red-700"
                            )}
                          >
                            <Link href={item.href}>
                              <span className="mr-2">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Submenu Configuracion - solo para administradores */}
              {showConfiguracion && (
                <Collapsible>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-sm font-semibold">
                        <Settings className="text-lg mr-2" />
                        <span>Configuración</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {configuracionItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                              className={cn(
                                "text-sm",
                                pathname === item.href &&
                                  "bg-red-600 text-white hover:bg-red-700"
                              )}
                            >
                              <Link href={item.href}>
                                <span className="mr-2">{item.icon}</span>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col items-center space-y-4">
          {/* informacion del usuario con avatar */}
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-600 text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.username || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>

          {/* toggle de tema y boton de cerrar sesion */}
          <div className="flex gap-2 w-full">
            <ModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex-1 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesion
            </Button>
          </div>

          {/* informacion de la empresa */}
          <div className="text-center text-xs text-gray-500 w-full">
            <p>Optimizacion Operativa</p>
            <p className="mt-1">© 2025</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}