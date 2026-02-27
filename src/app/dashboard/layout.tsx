import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                {/* Content area: pushed right on desktop, full width on mobile */}
                <div className="lg:pl-64 flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 p-4 sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
