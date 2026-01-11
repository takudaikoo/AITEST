"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
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

    // Activation State
    const [actEmail, setActEmail] = useState("");
    const [actPassword, setActPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            alert(error.message || "ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Sign up creates the auth user. 
            // The trigger in DB will handle profile creation from employee_master if matches.
            const { error } = await supabase.auth.signUp({
                email: actEmail,
                password: actPassword,
            });
            if (error) throw error;

            alert("登録確認メールを送信しました。メール内のリンクをクリックしてログインしてください。（開発環境の場合は不要な場合があります）");
            // If auto-confirm is on in dev:
            router.push("/dashboard");
        } catch (error: any) {
            alert(error.message || "登録に失敗しました");
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

                <Card className="glass-dark border-white/10">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/5 rounded-none px-0">
                            <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary transition-all">ログイン</TabsTrigger>
                            <TabsTrigger value="activation" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary transition-all">初回登録</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="p-6 space-y-4">
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
                        </TabsContent>

                        <TabsContent value="activation" className="p-6 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4 bg-primary/10 p-3 rounded-md">
                                初回ログイン用のパスワードを設定します。会社に登録されているメールアドレスを使用してください。
                            </div>
                            <form onSubmit={handleActivation} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="act-email">メールアドレス (社用)</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="act-email" placeholder="name@company.com" className="pl-9 bg-background/50" value={actEmail} onChange={(e) => setActEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="act-password">パスワード設定</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="act-password" type="password" placeholder="6文字以上" className="pl-9 bg-background/50" value={actPassword} onChange={(e) => setActPassword(e.target.value)} minLength={6} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    パスワードを設定して開始
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </Card>

                <div className="text-center">
                    <Button variant="link" className="text-xs text-muted-foreground" onClick={() => router.push('/admin')}>
                        管理者はこちら
                    </Button>
                </div>
            </div>
            <div className="absolute bottom-4 text-xs text-muted-foreground/50">
                &copy; 2024 AI Manabu-kun Inc. All rights reserved.
            </div>
        </main>
    );
}
