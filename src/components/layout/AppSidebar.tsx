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
import Logo from "../../assets/img/logo.jpg"
import { Server, CloudDownload, } from "lucide-react";
import { ModeToggle } from "@/components/provider/theme-toggle";

const menuItems = [
  // { icon: "📊", label: "Dashboard", href: "/" },
  { icon: <CloudDownload/>, label: "Descargas", href: "/download" },
  { icon: <Server/>, label: "Procesos", href: "/process" },
  // { icon: "📄", label: "Reportes", href: "/reports" },
  // { icon: "⚙️", label: "Configuración", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo">
            <img
                    alt="Logo"
                    src={Logo.src}
                    width="40"
                    className="d-inline-block align-top rounded-3 me-3 shadow-sm"
                />
          </div>
          <div className="font-bold text-lg">
            Apuesta <span className="text-red-600">Total</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "text-sm font-semibold",
                      pathname === item.href && "bg-red-600 text-white hover:bg-red-700"
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
          {/* Toggle de tema */}
          <div className="flex justify-center">
            <ModeToggle />
          </div>
        <div className="text-center text-xs text-gray-500">
          <p>Optimizacion Operativa</p>
          <p className="mt-1">© 2025</p>
        </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}