import { createClient } from "@/lib/supabase/server";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, BookOpen } from "lucide-react";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Auth Error</div>;

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select(`*, departments(name)`)
        .eq("id", user.id)
        .single();

    // 2. Fetch Weaknesses
    const { data: weaknesses } = await supabase
        .from("weaknesses")
        .select(`
        failure_count,
        questions ( text, phase, difficulty, explanation )
    `)
        .eq("user_id", user.id)
        .order("failure_count", { ascending: false })
        .limit(5);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {profile?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{profile?.email}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{profile?.departments?.name || "部署未設定"}</span>
                        <span>•</span>
                        <Badge variant="secondary">{profile?.rank || "Beginner"}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            現在のXP (経験値)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold mb-2">{profile?.xp || 0} XP</div>
                        <Progress value={(profile?.xp || 0) % 1000 / 10} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-2">次のランクまであと {1000 - ((profile?.xp || 0) % 1000)} XP</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-red-500" />
                            苦手な問題 (要復習)
                        </CardTitle>
                        <CardDescription>よく間違える問題がここに表示されます。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {weaknesses?.map((w: any, i) => (
                                <div key={i} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                                    <div className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded h-fit shrink-0">
                                        x{w.failure_count}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm mb-1">{w.questions?.text}</p>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>Phase: {w.questions?.phase}</span>
                                            <span>Lv: {w.questions?.difficulty}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!weaknesses || weaknesses.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">弱点データはまだありません。素晴らしい！</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
