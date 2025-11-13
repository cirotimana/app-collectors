import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DiscrepanciesAlert } from "@/components/provider/discrepancies-alert";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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