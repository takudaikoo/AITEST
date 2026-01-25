"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Clock, Trophy, PlayCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function DashboardPage() {
    const supabase = createClient();

    // State
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [inProgressPrograms, setInProgressPrograms] = useState<any[]>([]);
    const [recommendedPrograms, setRecommendedPrograms] = useState<any[]>([]);
    const [stats, setStats] = useState({ completed: 0, currentRank: 'Beginner', nextRankXP: 100 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            // 1. Profile & Stats
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // Mock stats logic for now or fetch real counts
            // Real count:
            const { count: completedCount } = await supabase
                .from('learning_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .or('is_passed.eq.true,programs(type).eq.lecture'); // Complex query, simplify: just count history rows for now

            setStats({
                completed: completedCount || 0,
                currentRank: profileData?.rank || 'Beginner',
                nextRankXP: 1000 - (profileData?.xp || 0) // Example logic
            });

            // 2. In Progress (History with no score or explict status)
            // Assuming 'in_progress' status or no score
            const { data: inProgress } = await supabase
                .from('learning_history')
                .select(`
                    id,
                    started_at,
                    programs (
                        id, title, description, type, time_limit, category
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'in_progress')
                .order('started_at', { ascending: false })
                .limit(10);

            setInProgressPrograms(inProgress?.map(h => ({ ...h.programs, history_id: h.id })) || []);

            // 3. Recommended (Programs not in history)
            // Simplified: Just fetch active programs limit 6
            const { data: recommended } = await supabase
                .from('programs')
                .select('*')
                .eq('is_active', true)
                .limit(6);

            // Client side filter out already started if needed, or just show them
            setRecommendedPrograms(recommended || []);

            setLoading(false);
        };

        loadData();
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">おかえりなさい、{profile?.full_name || 'ユーザー'}さん</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border-violet-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-violet-200">現在のランク</CardTitle>
                            <Trophy className="h-4 w-4 text-violet-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white shadow-glow">{stats.currentRank}</div>
                            <p className="text-xs text-violet-300/70">{profile?.xp || 0} XP</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-cyan-200">学習完了数</CardTitle>
                            <BookOpen className="h-4 w-4 text-cyan-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.completed}</div>
                            <p className="text-xs text-cyan-300/70">プログラム</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {inProgressPrograms.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <PlayCircle className="h-6 w-6 text-blue-500" />
                        <h3 className="text-xl font-semibold">学習を再開する</h3>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <div className="flex w-max space-x-4 p-4">
                            {inProgressPrograms.map((program) => (
                                <Card key={program.history_id} className="w-[300px] shrink-0">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant={program.type === 'lecture' ? 'secondary' : 'default'}>
                                                {program.type === 'test' ? '小テスト' :
                                                    program.type === 'exam' ? '試験' : '講習'}
                                            </Badge>
                                        </div>
                                        <CardTitle className="truncate leading-tight text-base" title={program.title}>{program.title}</CardTitle>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link href={`/dashboard/programs/${program.id}/play`}>再開する</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">おすすめの学習プログラム</h3>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/programs">すべて見る <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recommendedPrograms.map((program) => (
                        <Card key={program.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={program.type === 'lecture' ? 'secondary' : program.type === 'exam' ? 'destructive' : 'default'}>
                                        {program.type === 'test' ? '小テスト' :
                                            program.type === 'exam' ? '認定試験' : '講習'}
                                    </Badge>
                                    {program.category && <Badge variant="outline" className="text-xs truncate max-w-[120px]">{program.category}</Badge>}
                                </div>
                                <CardTitle className="line-clamp-1">{program.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{program.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center text-sm text-muted-foreground gap-4">
                                    {program.time_limit && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{program.time_limit}分</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href={`/dashboard/programs/${program.id}`}>詳細を見る</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
