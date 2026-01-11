import { UserHeader } from "@/components/user/Header";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <UserHeader />
            <main className="flex-1 container py-6 md:py-10">
                {children}
            </main>
        </div>
    );
}
