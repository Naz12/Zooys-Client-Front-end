import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import DashboardTabs from "@/components/dashboard-tabs";

export default function Page() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 md:p-10 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto">
            <DashboardTabs />
          </div>
        </main>
      </div>
    </div>
  );
}
