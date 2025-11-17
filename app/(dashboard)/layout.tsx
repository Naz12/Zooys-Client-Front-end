"use client";

import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import ProtectedRoute from "@/components/auth/protected-route";
import { usePathname } from "next/navigation";
import { useVisitorTracking } from "@/lib/hooks/use-visitor-tracking";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditorPage = pathname?.includes('/presentation/editor/');
  
  // Initialize visitor tracking
  useVisitorTracking();

  return (
    <ProtectedRoute>
      {isEditorPage ? (
        // Full screen layout for editor (no sidebar/topbar)
        <div className="h-screen overflow-hidden">
          {children}
        </div>
      ) : (
        // Normal dashboard layout with sidebar and topbar
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-auto bg-background">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
