import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, BrainCircuit, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecentActivityChart } from "@/components/admin/dashboard/RecentActivityChart";
import { format, subDays, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";

export default async function AdminDashboard() {
    const supabase = createClient();

    // 1. Basic Stats
    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

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

    // 2. Average Rank Logic
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('rank');

    let totalRankScore = 0;
    let rankCount = 0;

    if (allProfiles) {
        allProfiles.forEach(p => {
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
    if (avgScore >= 3.5) avgRankLabel = "S";
    else if (avgScore >= 2.5) avgRankLabel = "A";
    else if (avgScore >= 1.5) avgRankLabel = "B";
    else if (avgScore > 0) avgRankLabel = "C";

    // 3. Department Ranking Logic
    // Fetch departments
    const { data: departments } = await supabase.from('departments').select('*');
    // Fetch profiles with department
    const { data: profileDepts } = await supabase.from('profiles').select('id, department_id');
    // Fetch all completed history scores
    const { data: histories } = await supabase
        .from('learning_history')
        .select('score, user_id')
        .eq('status', 'completed')
        .not('score', 'is', null);

    // Map: UserID -> DeptID
    const userDeptMap = new Map<string, string>();
    profileDepts?.forEach(p => {
        if (p.department_id) userDeptMap.set(p.id, p.department_id);
    });

    // Aggregate Scores by Dept
    const deptStats = new Map<string, { total: number, count: number }>();

    histories?.forEach(h => {
        const deptId = userDeptMap.get(h.user_id);
        if (deptId) {
            const current = deptStats.get(deptId) || { total: 0, count: 0 };
            deptStats.set(deptId, {
                total: current.total + (h.score || 0),
                count: current.count + 1
            });
        }
    });

    // Calculate Avg and Sort
    const deptRanking = departments?.map(d => {
        const stats = deptStats.get(d.id);
        const avg = stats && stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
        return { name: d.name, avg, count: stats?.count || 0 };
    }).sort((a, b) => b.avg - a.avg).slice(0, 5) || [];


    // 4. Recent Activity Chart (Last 7 days)
    const today = new Date();
    const startDate = subDays(today, 6);
    const { data: recentLogs } = await supabase
        .from('learning_history')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    const chartData = [];
    for (let i = 0; i < 7; i++) {
        const date = subDays(today, 6 - i);
        const dateStr = format(date, 'MM/dd', { locale: ja });

        // Count logs for this day
        const count = recentLogs?.filter(log => isSameDay(new Date(log.created_at), date)).length || 0;
        chartData.push({ name: dateStr, total: count });
    }


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
                        <p className="text-xs text-muted-foreground">平均ランクスコア: {avgScore.toFixed(1)}</p>
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
                        <CardTitle>最近の試験実施状況 (過去7日間)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RecentActivityChart data={chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>部署別ランキング</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {deptRanking.length === 0 && <p className="text-sm text-muted-foreground">データがありません</p>}
                            {deptRanking.map((dept, index) => (
                                <div key={dept.name} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{dept.name}</p>
                                        <p className="text-sm text-muted-foreground">平均スコア: {dept.avg}点</p>
                                    </div>
                                    <div className="ml-auto font-medium">{index + 1}位</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
