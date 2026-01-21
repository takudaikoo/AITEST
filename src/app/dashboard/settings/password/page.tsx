"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PasswordChangePage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            alert("パスワードが一致しません");
            return;
        }
        if (password.length < 6) {
            alert("パスワードは6文字以上で設定してください");
            return;
        }

        setLoading(true);
        try {
            // Update password and set password_changed flag in metadata
            const { error } = await supabase.auth.updateUser({
                password: password,
                data: { password_changed: true }
            });

            if (error) throw error;

            alert("パスワードを変更しました");
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "パスワード変更に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-10 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">パスワード変更</h1>
                <p className="text-muted-foreground text-sm">初回ログインのため、パスワードの変更が必要です。</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">新しいパスワードを設定</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">新しいパスワード</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-9"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="6文字以上"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">パスワード（確認）</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirm"
                                    type="password"
                                    className="pl-9"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="同じパスワードを入力"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            変更してダッシュボードへ
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
