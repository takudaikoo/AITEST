import { AdminSidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <h1 className="text-lg font-semibold">管理画面</h1>
                </header>
                <main className="flex-1 overflow-y-auto bg-secondary/20 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
