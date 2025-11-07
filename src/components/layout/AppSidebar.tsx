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
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Logo from "../../assets/img/logo.jpg";
import { Server, CloudDownload, Gpu, LayoutDashboard, BookText   } from "lucide-react";
import { ModeToggle } from "@/components/provider/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const menuItems = [
  { icon: <LayoutDashboard  />, label: "Dashboard", href: "/dashboard" },
  { icon: <BookText  />, label: "Detalles", href: "/details" },
  { icon: <Server />, label: "Procesos", href: "/process" },
  { icon: <CloudDownload />, label: "Descargas", href: "/download" },
  { icon: <Gpu />, label: "Digital", href: "/digital" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Funcion para obtener las iniciales del usuario
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
              {menuItems.map((item) => (
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Informacion del usuario con Avatar */}
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user?.photoURL || ""} 
                alt={user?.displayName || "Usuario"} 
              />
              <AvatarFallback className="bg-gray-600 text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.displayName || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Toggle de tema y boton de cerrar sesion */}
          <div className="flex gap-2 w-full">
            <ModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex-1 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesion
            </Button>
          </div>

          {/* Informacion de la empresa */}
          <div className="text-center text-xs text-gray-500 w-full">
            <p>Optimizacion Operativa</p>
            <p className="mt-1">© 2025</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}