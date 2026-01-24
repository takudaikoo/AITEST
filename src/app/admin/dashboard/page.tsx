import { createServiceClient } from "@/lib/supabase/service";
import { format, subDays, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DashboardClient } from "@/components/admin/dashboard/DashboardClient";

export default async function AdminDashboard() {
    const supabase = createServiceClient();

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
    const { data: departments } = await supabase.from('departments').select('*');
    // Fetch profiles with department AND XP
    const { data: profileDepts } = await supabase.from('profiles').select('id, department_id, xp');

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

    // Score Ranking (Avg Score)
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

    const byScore = departments?.map(d => {
        const stats = deptStats.get(d.id);
        const avg = stats && stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
        return { name: d.name, value: avg };
    }).sort((a, b) => b.value - a.value).slice(0, 5) || [];

    // XP Ranking (Total XP)
    const deptXPStats = new Map<string, number>();
    profileDepts?.forEach(p => {
        if (p.department_id) {
            const current = deptXPStats.get(p.department_id) || 0;
            deptXPStats.set(p.department_id, current + (p.xp || 0));
        }
    });

    const byXP = departments?.map(d => {
        const total = deptXPStats.get(d.id) || 0;
        return { name: d.name, value: total }; // Total XP
    }).sort((a, b) => b.value - a.value).slice(0, 5) || [];


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
        const count = recentLogs?.filter(log => isSameDay(new Date(log.created_at), date)).length || 0;
        chartData.push({ name: dateStr, total: count });
    }

    return (
        <DashboardClient
            stats={{
                usersCount: usersCount || 0,
                totalAttempts: totalAttempts || 0,
                formattedAttempts: totalAttempts ? totalAttempts.toLocaleString() : "0",
                avgRankLabel,
                avgScore,
                completionRate,
                completedCount
            }}
            chartData={chartData}
            rankings={{
                byScore,
                byXP
            }}
        />
    );
}
