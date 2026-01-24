import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, BrainCircuit, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
    const supabase = createClient();

    // 1. Total Users
    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // 2. Total Attempts & Completion Rate
    const { count: totalAttempts } = await supabase
        .from('learning_history')
        .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await supabase
        .from('learning_history')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

    const completionRate = (totalAttempts && totalAttempts > 0)
        ? Math.round(((completedCount || 0) / totalAttempts) * 100)
        : 0;

    // 3. Average Rank Logic
    // Fetch all user ranks
    const { data: profiles } = await supabase
        .from('profiles')
        .select('rank');

    // Map Rank to Score: Beginner=1, Standard=2, Expert=3, Master=4
    let totalRankScore = 0;
    let rankCount = 0;

    if (profiles) {
        profiles.forEach(p => {
            if (p.rank) {
                rankCount++;
                if (p.rank === 'Master') totalRankScore += 4;
                else if (p.rank === 'Expert') totalRankScore += 3;
                else if (p.rank === 'Standard') totalRankScore += 2;
                else totalRankScore += 1; // Beginner
            }
        });
    }

    const avgScore = rankCount > 0 ? totalRankScore / rankCount : 0;
    let avgRankLabel = "-";
    if (avgScore >= 3.5) avgRankLabel = "S"; // Master avg
    else if (avgScore >= 2.5) avgRankLabel = "A"; // Expert avg
    else if (avgScore >= 1.5) avgRankLabel = "B"; // Standard avg
    else if (avgScore > 0) avgRankLabel = "C"; // Beginner avg

    // For "Top 20% is A Rank" -> We can just show distribution maybe? or leave dummy text or simple "Users: X"
    // Let's rely on standard distribution text or just hide the subtext.

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総試験回数</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts ? totalAttempts.toLocaleString() : 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均AIランク</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgRankLabel}</div>
                        <p className="text-xs text-muted-foreground">Master/Expert/Standard/Beginner 平均</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">完了率</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">完了数: {completedCount}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>最近の試験実施状況</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full bg-secondary/20 flex items-center justify-center rounded-md">
                            <span className="text-muted-foreground">チャート実装予定</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>部署別ランキング</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Dummy for now or complex query needed. keeping static is safer unless calculating manually */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">開発部</p>
                                    <p className="text-sm text-muted-foreground">平均スコア: 92点</p>
                                </div>
                                <div className="ml-auto font-medium">1位</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">営業部</p>
                                    <p className="text-sm text-muted-foreground">平均スコア: 88点</p>
                                </div>
                                <div className="ml-auto font-medium">2位</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
