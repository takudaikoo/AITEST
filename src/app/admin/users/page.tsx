
import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserEditDialog } from "@/components/admin/users/UserEditDialog";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
    const supabase = createClient();

    // Fetch users with their departments
    const { data: users, error } = await supabase
        .from("profiles")
        .select(`
            id,
            email,
            full_name,
            role,
            rank,
            xp,
            department_id,
            departments (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false });

    const { data: departments } = await supabase
        .from("departments")
        .select("*")
        .order("name");

    // Fetch learning history for stats
    const { data: history } = await supabase
        .from("learning_history")
        .select("user_id, score, is_passed")
        .eq("status", "completed");

    // --- Statistics Calculation ---
    // 1. Individual Stats
    const userMap = new Map<string, { attempts: number; passed: number; totalScore: number }>();
    history?.forEach(h => {
        const current = userMap.get(h.user_id) || { attempts: 0, passed: 0, totalScore: 0 };
        current.attempts++;
        if (h.is_passed) current.passed++;
        current.totalScore += (h.score || 0);
        userMap.set(h.user_id, current);
    });

    // 2. Department Stats (Accumulators)
    const deptMap = new Map<string, { xp: number; acc: number; rate: number; count: number; members: number }>();

    // Initialize Dept Map (optional if we iterate users, but good for safety)
    departments?.forEach(d => {
        deptMap.set(d.id, { xp: 0, acc: 0, rate: 0, count: 0, members: 0 });
    });

    // Calculate Individual Metrics & Aggregate to Dept
    const userMetrics = new Map<string, { acc: number; rate: number; count: number }>();

    users?.forEach(user => {
        const stats = userMap.get(user.id) || { attempts: 0, passed: 0, totalScore: 0 };

        const accuracy = stats.attempts > 0 ? (stats.totalScore / stats.attempts) : 0;
        const passRate = stats.attempts > 0 ? (stats.passed / stats.attempts) * 100 : 0;
        const passCount = stats.passed;
        const xp = user.xp || 0;

        userMetrics.set(user.id, { acc: accuracy, rate: passRate, count: passCount });

        if (user.department_id) {
            const d = deptMap.get(user.department_id);
            if (!d) {
                // If department exists in profile but not in fetched depts (rare mismatch), create it
                deptMap.set(user.department_id, { xp, acc: accuracy, rate: passRate, count: passCount, members: 1 });
            } else {
                d.xp += xp;
                d.acc += accuracy;
                d.rate += passRate;
                d.count += passCount;
                d.members++;
            }
        }
    });

    // Helper to get Team Stats
    const getTeamStats = (deptId: string | null) => {
        if (!deptId) return null;
        const d = deptMap.get(deptId);
        if (!d || d.members === 0) return null;
        return {
            xp: d.xp / d.members,
            acc: d.acc / d.members,
            rate: d.rate / d.members,
            count: d.count / d.members
        };
    };

    console.log(users);

    if (error) {
        return <div>Error loading users: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
                    <p className="text-muted-foreground">
                        ユーザーの権限や所属部署を管理します。
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead rowSpan={2} className="w-[150px]">名前 / ランク</TableHead>
                            <TableHead rowSpan={2}>部署</TableHead>
                            <TableHead colSpan={4} className="text-center border-l border-r border-border/50">個人成績</TableHead>
                            <TableHead colSpan={4} className="text-center border-r border-border/50">チーム成績</TableHead>
                            <TableHead rowSpan={2} className="text-right">操作</TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                            {/* Individual Sub-headers */}
                            <TableHead className="text-center text-xs border-l border-border/50 w-[60px]">XP</TableHead>
                            <TableHead className="text-center text-xs w-[60px]">正答率</TableHead>
                            <TableHead className="text-center text-xs w-[60px]">合格率</TableHead>
                            <TableHead className="text-center text-xs w-[60px] border-r border-border/50">合格数</TableHead>

                            {/* Team Sub-headers */}
                            <TableHead className="text-center text-xs w-[60px]">XP</TableHead>
                            <TableHead className="text-center text-xs w-[60px]">正答率</TableHead>
                            <TableHead className="text-center text-xs w-[60px]">合格率</TableHead>
                            <TableHead className="text-center text-xs w-[60px] border-r border-border/50">合格数</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{user.full_name || "未設定"}</span>
                                        <Badge variant="outline" className="w-fit scale-75 origin-left mt-1">{user.rank}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>{(user.departments as any)?.name || "-"}</TableCell>

                                {/* Individual */}
                                <TableCell className="text-center border-l bg-slate-50/50">{user.xp}</TableCell>
                                <TableCell className="text-center bg-slate-50/50">{userMetrics.get(user.id)?.acc.toFixed(0)}%</TableCell>
                                <TableCell className="text-center bg-slate-50/50">{userMetrics.get(user.id)?.rate.toFixed(0)}%</TableCell>
                                <TableCell className="text-center border-r bg-slate-50/50">{userMetrics.get(user.id)?.count}回</TableCell>

                                {/* Team */}
                                {(() => {
                                    const team = getTeamStats(user.department_id);
                                    return (
                                        <>
                                            <TableCell className="text-center">{team ? team.xp.toFixed(0) : "-"}</TableCell>
                                            <TableCell className="text-center">{team ? team.acc.toFixed(0) + "%" : "-"}</TableCell>
                                            <TableCell className="text-center">{team ? team.rate.toFixed(0) + "%" : "-"}</TableCell>
                                            <TableCell className="text-center border-r">{team ? team.count.toFixed(1) + "回" : "-"}</TableCell>
                                        </>
                                    );
                                })()}
                                <TableCell className="text-right">
                                    <UserEditDialog
                                        user={user}
                                        departments={departments || []}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
