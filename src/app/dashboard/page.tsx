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
    const [stats, setStats] = useState({ completed: 0, currentRank: 'Beginner', nextRankXP: 100 });
    const [mandatoryPrograms, setMandatoryPrograms] = useState<any[]>([]);
    const [recommendedPrograms, setRecommendedPrograms] = useState<any[]>([]);
    const [completedPrograms, setCompletedPrograms] = useState<any[]>([]);
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

            // Fetch History (Completed or In Progress)
            const { data: history } = await supabase
                .from('learning_history')
                .select(`
                    id,
                    started_at,
                    score,
                    is_passed,
                    status,
                    programs (
                        id, title, description, type, time_limit, category, is_mandatory
                    )
                `)
                .eq('user_id', user.id);

            // Determine completed program IDs
            const completedHistory = history?.filter(h => h.is_passed || h.status === 'completed') || [];

            const getProgramId = (item: any) => {
                const prog = item.programs;
                if (Array.isArray(prog)) return prog[0]?.id;
                return prog?.id;
            };

            const completedProgramIds = new Set(completedHistory.map(h => getProgramId(h)).filter(Boolean));

            // Stats
            const completedCount = completedHistory.length;
            setStats({
                completed: completedCount || 0,
                currentRank: profileData?.rank || 'Beginner',
                nextRankXP: 1000 - (profileData?.xp || 0)
            });

            // 2. Fetch Active Programs
            const { data: allPrograms } = await supabase
                .from('programs')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (allPrograms) {
                const mandatory: any[] = [];
                const recommended: any[] = [];
                const completed: any[] = [];

                allPrograms.forEach(p => {
                    if (completedProgramIds.has(p.id)) {
                        // Add to Completed List
                        // Find history entry for details if needed
                        const hist = completedHistory.find(h => getProgramId(h) === p.id);
                        completed.push({ ...p, history: hist });
                    } else {
                        if (p.is_mandatory) {
                            mandatory.push(p);
                        } else {
                            recommended.push(p);
                        }
                    }
                });

                setMandatoryPrograms(mandatory);
                setRecommendedPrograms(recommended);
                setCompletedPrograms(completed);
            }

            setLoading(false);
        };

        loadData();
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const ProgramCard = ({ program, isCompleted }: { program: any, isCompleted?: boolean }) => (
        <Card className={`flex flex-col h-full ${isCompleted ? 'opacity-80' : ''}`}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1 items-center">
                        <Badge variant={program.type === 'lecture' ? 'secondary' : program.type === 'exam' ? 'destructive' : 'default'} className="text-[10px] px-1 py-0 h-5">
                            {program.type === 'test' ? '小テスト' :
                                program.type === 'exam' ? '認定試験' : '講習'}
                        </Badge>
                        {program.category && <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 max-w-[80px] truncate">{program.category}</Badge>}
                    </div>
                    {isCompleted && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px]">完了</Badge>}
                </div>
                <CardTitle className="text-sm font-bold line-clamp-2 leading-tight min-h-[2.5em]">{program.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{program.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {program.time_limit > 0 && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{program.time_limit}分</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button size="sm" className="w-full text-xs" asChild variant={isCompleted ? "outline" : "default"}>
                    <Link href={`/dashboard/programs/${program.id}${isCompleted && program.type !== 'lecture' ? '/result/' + program.history?.id : ''}`}>
                        {isCompleted ? '結果を見る' : '詳細を見る'}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-6 pb-8">
            <section>
                <h2 className="text-2xl font-bold tracking-tight mb-4">おかえりなさい、{profile?.full_name || 'ユーザー'}さん</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Mandatory */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 border-red-500/30">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <h3 className="font-bold text-lg">必修プログラム</h3>
                        <Badge variant="secondary" className="ml-auto">{mandatoryPrograms.length}</Badge>
                    </div>
                    <div className="space-y-3">
                        {mandatoryPrograms.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                                現在必修のプログラムはありません
                            </div>
                        ) : (
                            mandatoryPrograms.map(p => <ProgramCard key={p.id} program={p} />)
                        )}
                    </div>
                </div>

                {/* Column 2: Recommended */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 border-blue-500/30">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        <h3 className="font-bold text-lg">おすすめのプログラム</h3>
                        <Badge variant="secondary" className="ml-auto">{recommendedPrograms.length}</Badge>
                    </div>
                    <div className="space-y-3">
                        {recommendedPrograms.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                                おすすめのプログラムはありません
                            </div>
                        ) : (
                            recommendedPrograms.map(p => <ProgramCard key={p.id} program={p} />)
                        )}
                    </div>
                </div>

                {/* Column 3: Completed */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 border-green-500/30">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <h3 className="font-bold text-lg">学習済みプログラム</h3>
                        <Badge variant="secondary" className="ml-auto">{completedPrograms.length}</Badge>
                    </div>
                    <div className="space-y-3">
                        {completedPrograms.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                                まだ完了したプログラムはありません
                            </div>
                        ) : (
                            completedPrograms.map(p => <ProgramCard key={p.id} program={p} isCompleted />)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { CheckCircle2, AlertCircle } from "lucide-react";
