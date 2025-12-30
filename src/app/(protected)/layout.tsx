"use client"

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DiscrepanciesAlert } from "@/components/provider/discrepancies-alert";
import { useAuthStore } from "@/store/auth-store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, startRolePolling, stopRolePolling } = useAuthStore();

  useEffect(() => {
    // Iniciar polling cuando el usuario esté autenticado
    if (isAuthenticated) {
      startRolePolling();
    }

    // Cleanup: detener polling al desmontar
    return () => {
      stopRolePolling();
    };
  }, [isAuthenticated, startRolePolling, stopRolePolling]);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full">
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="p-8">
            {children}
          </div>
        </main>
        <DiscrepanciesAlert />
      </SidebarProvider>
    </ProtectedRoute>
  );
}