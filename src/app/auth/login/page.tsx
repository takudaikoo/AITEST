"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrainCircuit, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            // Check admin role immediately
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ユーザー情報の取得に失敗しました");

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || profile.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error("管理者権限がありません");
            }

            router.push("/admin/dashboard");
            router.refresh();

        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-slate-950 text-slate-100 p-4">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/05 blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="z-10 w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-background border border-white/10 glass-dark shadow-glow mb-4">
                        <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">AI試験くん 管理システム</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Administrator Access</p>
                </div>

                <Card className="glass-dark border-white/10 bg-black/40 text-slate-200">
                    <CardHeader>
                        <CardTitle className="text-center">管理者ログイン</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errorMsg && (
                            <div className="bg-destructive/20 border border-destructive/50 p-3 rounded text-xs text-destructive flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" />
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">メールアドレス</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" placeholder="admin@company.com" className="pl-9 bg-background/50 border-white/10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">パスワード</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="password" type="password" className="pl-9 bg-background/50 border-white/10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ログイン
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
