import { createClient } from "@/lib/supabase/server";
import { UserHeader } from "@/components/user/Header";

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = data;
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <UserHeader user={profile} />
            <main className="flex-1 container py-6 md:py-10">
                {children}
            </main>
        </div>
    );
}
