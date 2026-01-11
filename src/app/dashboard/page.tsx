import { createClient } from "@/lib/supabase/server";
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
import { ArrowRight, BookOpen, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { Leaderboard } from "@/components/gamification/Leaderboard";

async function getRecommendedPrograms() {
    const supabase = createClient();
    const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .limit(3);
    return data || [];
}

export default async function DashboardPage() {
    const recommended = await getRecommendedPrograms();

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">おかえりなさい、ユーザーさん</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border-violet-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-violet-200">現在のランク</CardTitle>
                            <Trophy className="h-4 w-4 text-violet-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white shadow-glow">Beginner</div>
                            <p className="text-xs text-violet-300/70">次のランクまであと 120 XP</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-cyan-200">学習済みプログラム</CardTitle>
                            <BookOpen className="h-4 w-4 text-cyan-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">12</div>
                            <p className="text-xs text-cyan-300/70">今月の完了数: 3</p>
                        </CardContent>
                    </Card>
                    {/* Add Leaderboard Summary or other stats if needed */}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">おすすめの学習プログラム</h3>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/programs">すべて見る <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recommended.map((program) => (
                        <Card key={program.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={program.type === 'lecture' ? 'secondary' : 'default'}>
                                        {program.type === 'test' ? '小テスト' :
                                            program.type === 'exam' ? '試験' : '講習'}
                                    </Badge>
                                    {program.category && <Badge variant="outline">{program.category}</Badge>}
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
                                    <div className="flex items-center gap-1">
                                        <span>合格点: {program.passing_score || '-'}点</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href={`/dashboard/programs/${program.id}`}>開始する</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
