"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner or similar usage, or use alert

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Login Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (error) throw error;

            // Check for initial password change requirement for specific user
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.email?.includes("smagol01") && !user?.user_metadata?.password_changed) {
                router.push("/dashboard/settings/password");
            } else {
                router.push("/dashboard");
            }

            router.refresh();
        } catch (error: any) {
            alert(error.message || "ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-background selection:bg-primary/20 p-4">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/05 blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="z-10 w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-background border border-white/10 glass-dark shadow-glow mb-4">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">AI学ぶくん</h1>
                    <p className="text-sm text-muted-foreground">社内AIリテラシー向上プラットフォーム</p>
                </div>

                <Card className="glass-dark border-white/10 p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" placeholder="name@company.com" className="pl-9 bg-background/50" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="password" type="password" className="pl-9 bg-background/50" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ログイン
                        </Button>
                    </form>
                </Card>


            </div>
            <div className="absolute bottom-4 text-xs text-muted-foreground/50">
                &copy; 2024 AI Manabu-kun Inc. All rights reserved.
            </div>
        </main>
    );
}
