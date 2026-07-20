import type { ReactNode } from "react";
import { Sidebar, Header, Footer } from "@/components/layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Sidebar (Responsive collapsible) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header/Navbar */}
        <Header />

        {/* Dynamic Route Workspace */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
}
