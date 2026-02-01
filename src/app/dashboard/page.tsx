"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, BookOpen, Clock, Trophy, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { calculateLevel, getLevelProgress } from "@/lib/level-utils";

export default function DashboardPage() {
    const supabase = createClient();

    // State
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ completed: 0, currentRank: 'Beginner', level: 1, nextLevelProgress: 0 });
    const [lectures, setLectures] = useState<any[]>([]);
    const [tests, setTests] = useState<any[]>([]);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Filters
    const [lectureCategory, setLectureCategory] = useState<string>('all');
    const [testLevel, setTestLevel] = useState<string>('all');

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
                        id, title
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
            const compIds = new Set(completedHistory.map(h => getProgramId(h)).filter(Boolean));
            setCompletedIds(compIds);

            // Stats (Level Calculation)
            const curXp = profileData?.xp || 0;
            const { level, rank } = calculateLevel(curXp);
            const progress = getLevelProgress(curXp);
            const completedCount = completedHistory.length;

            setStats({
                completed: completedCount || 0,
                currentRank: rank,
                level: level,
                nextLevelProgress: progress
            });

            // 2. Fetch Active Programs (Sorted Ascending by Title)
            const { data: allPrograms } = await supabase
                .from('programs')
                .select('*')
                .eq('is_active', true)
                .order('title', { ascending: true }); // Ascending order requested

            if (allPrograms) {
                const lecs = allPrograms.filter(p => p.type === 'lecture');
                const tsts = allPrograms.filter(p => p.type === 'test' || p.type === 'exam');

                // Attach history to items if needed, or just use completedIds set
                // Map to include completion status for easier rendering
                const mapWithStatus = (list: any[]) => list.map(p => ({
                    ...p,
                    isCompleted: compIds.has(p.id),
                    // historyId for link could be found from completedHistory if needed
                    historyId: completedHistory.find(h => getProgramId(h) === p.id)?.id
                }));

                setLectures(mapWithStatus(lecs));
                setTests(mapWithStatus(tsts));
            }

            setLoading(false);
        };

        loadData();
    }, []);

    // Helper: Get unique categories for lectures
    const lectureCategories = Array.from(new Set(lectures.map(p => p.category))).filter(Boolean).sort();

    // Helper: Logic for Progressive Difficulty
    // Rule: Intermediate requires Beginner of same "Series" to be completed.
    // Heuristic: Series is defined by Title stripping the difficulty suffix.
    // e.g. "Security Basics - Beginner" -> Series "Security Basics"
    const isTestLocked = (program: any) => {
        if (program.isCompleted) return false;
        if (program.level_requirement > stats.level) return true;

        if (program.type !== 'test') return false; // Exams might have different rules (rank based), currently using level_req

        // Progressive Logic
        const title = program.title || "";
        let difficulty = 'beginner';
        if (title.includes('中級') || title.includes('Intermediate')) difficulty = 'intermediate';
        if (title.includes('上級') || title.includes('Advanced')) difficulty = 'advanced';

        if (difficulty === 'beginner') return false; // Always unlocked if level met

        // Find prerequisites
        // Assuming naming convention: "Title..." 
        // We need to find the "Beginner" version of THIS test.
        // Simplest heuristic: Match category and assume there's a beginner one. 
        // Or check if there is a 'Beginner' test with similar title.
        // Let's iterate all tests to find the prerequisite.
        // This might be heavy if many tests, but for <100 it's fine.

        // Strict unlock: Must complete *at least one* beginner test in same category? 
        // Or specific predecessor?
        // User said: "Current item's Beginner clear -> Intermediate display"
        // Let's try to match by Category + Level. 
        // "Level 1 Beginner" passed -> "Level 1 Intermediate" unlocked.

        if (difficulty === 'intermediate') {
            // Look for a Beginner test of same level (and maybe same category?) that is COMPLETED
            // This is a loose check but fits "Level 1 Beginner" -> "Level 1 Intermediate" flow.
            const hasBeginnerCleared = tests.some(t =>
                t.level_requirement === program.level_requirement &&
                (t.title.includes('初級') || t.title.includes('Beginner')) &&
                t.isCompleted
            );
            return !hasBeginnerCleared;
        }

        if (difficulty === 'advanced') {
            // Look for Intermediate completed
            const hasIntermediateCleared = tests.some(t =>
                t.level_requirement === program.level_requirement &&
                (t.title.includes('中級') || t.title.includes('Intermediate')) &&
                t.isCompleted
            );
            return !hasIntermediateCleared;
        }

        return false;
    };

    // Filtered Lists
    const filteredLectures = lectures.filter(l => {
        if (lectureCategory !== 'all' && l.category !== lectureCategory) return false;
        return true;
    });

    const filteredTests = tests.reduce((acc: any[], t) => {
        if (testLevel !== 'all' && t.level_requirement.toString() !== testLevel) return acc;

        // Visibility Logic: 
        // User said: "Clear Beginner -> Show Intermediate"
        // So we HIDE locked items effectively? Or show as Locked?
        // "が表示されるロジック" (will be displayed logic) implies HIDING if not unlocked.
        // Let's HIDE if locked by Progressive Logic (but specific Level Lock can be shown as locked card).

        const locked = isTestLocked(t);
        // If locked due to Difficulty Pre-req, HIDE it.
        // If locked due to User Level (but Pre-req met), SHOW it as Locked?
        // Let's be stick to "Beginner clear -> Intermediate display". 
        // So if I haven't cleared Beginner, Intermediate is NOT SHOWN.

        // Check if locked by Pre-req (Difficulty)
        const title = t.title || "";
        let difficulty = 'beginner';
        if (title.includes('中級') || title.includes('Intermediate')) difficulty = 'intermediate';
        if (title.includes('上級') || title.includes('Advanced')) difficulty = 'advanced';

        if (difficulty === 'intermediate') {
            const hasBeginnerCleared = tests.some(ot =>
                ot.level_requirement === t.level_requirement &&
                (ot.title.includes('初級') || ot.title.includes('Beginner')) &&
                ot.isCompleted
            );
            if (!hasBeginnerCleared) return acc; // Hide
        }
        if (difficulty === 'advanced') {
            const hasIntermediateCleared = tests.some(ot =>
                ot.level_requirement === t.level_requirement &&
                (ot.title.includes('中級') || ot.title.includes('Intermediate')) &&
                ot.isCompleted
            );
            if (!hasIntermediateCleared) return acc; // Hide
        }

        acc.push(t);
        return acc;
    }, []);


    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const ProgramCard = ({ program }: { program: any }) => {
        const isCompleted = program.isCompleted;
        // Level lock logic for card display
        const isLevelLocked = !isCompleted && program.level_requirement > stats.level;

        return (
            <Card className={`flex flex-col h-full bg-card/50 hover:bg-card/80 transition-all ${isCompleted ? 'opacity-70' : ''} ${isLevelLocked ? 'border-dashed opacity-60' : ''} relative`}>
                {isLevelLocked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[0.5px]">
                        <div className="bg-background/90 px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Lv.{program.level_requirement} が必要
                        </div>
                    </div>
                )}
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant={program.type === 'lecture' ? 'secondary' : 'default'} className="text-[10px] px-2 h-5">
                            {program.type === 'lecture' ? '講習' : 'テスト'}
                        </Badge>
                        {isCompleted && <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> 完了</Badge>}
                    </div>
                    <CardTitle className="text-sm font-bold line-clamp-2 leading-tight min-h-[2.5em]">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[4.5em]">{program.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        {program.xp_reward && <span className="flex items-center gap-1 text-yellow-600/80"><Trophy className="h-3 w-3" /> {program.xp_reward} XP</span>}
                        {program.level_requirement > 1 && <span className="">Lv.{program.level_requirement}〜</span>}
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button
                        size="sm"
                        className="w-full text-xs"
                        variant={isCompleted ? "outline" : "secondary"}
                        disabled={isLevelLocked}
                        asChild={!isLevelLocked}
                    >
                        {isLevelLocked ? 'ロック中' : (
                            <Link href={`/dashboard/programs/${program.id}${isCompleted && program.type !== 'lecture' ? '/result/' + program.historyId : ''}`}>
                                {isCompleted ? '復習する' : '開始する'}
                            </Link>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Stats */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">ダッシュボード</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-violet-900/10 to-indigo-900/10 border-violet-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">現在のランク</CardTitle>
                            <Trophy className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Lv.{stats.level} <span className="text-lg font-normal text-muted-foreground ml-1">{stats.currentRank}</span></div>
                            <Progress value={stats.nextLevelProgress} className="h-1 mt-2" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">学習完了</CardTitle>
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed} <span className="text-sm font-normal text-muted-foreground">レッスン</span></div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Column: Lectures */}
                <section className="space-y-4 lg:pr-8 lg:border-r border-border/50 min-h-[800px]">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">講習プログラム</h3>
                                <p className="text-xs text-muted-foreground">知識を習得しましょう</p>
                            </div>
                        </div>
                        <div className="w-[180px]">
                            <Select value={lectureCategory} onValueChange={setLectureCategory}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="カテゴリー" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">すべて表示</SelectItem>
                                    {lectureCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="h-[800px] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {filteredLectures.map(program => (
                                <ProgramCard key={program.id} program={program} />
                            ))}
                            {filteredLectures.length === 0 && (
                                <div className="col-span-2 text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    講習が見つかりません
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </section>

                {/* Right Column: Tests */}
                <section className="space-y-4 lg:pl-8 pt-8 lg:pt-0">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">テスト・試験</h3>
                                <p className="text-xs text-muted-foreground">理解度を確認しましょう</p>
                            </div>
                        </div>
                        <div className="w-[140px]">
                            <Select value={testLevel} onValueChange={setTestLevel}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="レベル" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全レベル</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                                        <SelectItem key={lvl} value={lvl.toString()}>Lv.{lvl}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="h-[800px] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {filteredTests.map(program => (
                                <ProgramCard key={program.id} program={program} />
                            ))}
                            {filteredTests.length === 0 && (
                                <div className="col-span-2 text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    表示可能なテストがありません
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </section>
            </div>
        </div>
    );
}


