import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import DashboardTabs from "@/components/dashboard-tabs";
import { TabProvider } from "@/lib/tab-context";
import ProtectedRoute from "@/components/auth/protected-route";
import { Home } from "lucide-react";

export default function Page() {
  return (
    <ProtectedRoute>
      <TabProvider>
        <div className="flex h-screen">
          <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 md:p-10 overflow-auto bg-background">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                <Home className="h-4 w-4" />
                <span>/</span>
                <span className="text-foreground font-medium">Dashboard</span>
              </div>
              <DashboardTabs />
            </div>
          </main>
        </div>
        </div>
      </TabProvider>
    </ProtectedRoute>
  );
}
