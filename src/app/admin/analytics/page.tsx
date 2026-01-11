import { createClient } from "@/lib/supabase/server";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BarChart, Users, Trophy, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function AnalyticsPage() {
    const supabase = createClient();

    // 1. Fetch Department Performance (Average Score / Participation)
    // This helps identify which departments need more training.
    // Note: Aggregation is better done in SQL/RPC for scale, but JS sort/filter ok for MVP.

    const { data: departments } = await supabase
        .from("departments")
        .select("id, name");

    // Fetch all completed history with department info
    // This query might be heavy if history grows large.
    const { data: attempts } = await supabase
        .from("learning_history")
        .select(`
        score, is_passed, status,
        user_id,
        profiles!inner ( department_id )
    `)
        .eq("status", "completed");

    const deptStats = departments?.map(dept => {
        const deptAttempts = attempts?.filter((a: any) => a.profiles.department_id === dept.id) || [];
        const total = deptAttempts.length;
        if (total === 0) return { name: dept.name, avgScore: 0, passRate: 0, total: 0 };

        const sumScore = deptAttempts.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0);
        const passedCount = deptAttempts.filter((a: any) => a.is_passed).length;

        return {
            name: dept.name,
            avgScore: Math.round(sumScore / total),
            passRate: Math.round((passedCount / total) * 100),
            total
        };
    }).sort((a, b) => b.passRate - a.passRate) || [];

    // 2. Fetch "Problematic Questions" (Weaknesses aggregated)
    // Which questions are most frequently failed?
    // We can query `weaknesses` table directly.
    const { data: worstQuestions } = await supabase
        .from("weaknesses")
        .select(`
        question_id, failure_count,
        questions ( text, phase )
    `)
        .order("failure_count", { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">パフォーマンス分析</h2>
                <p className="text-muted-foreground">組織全体の学習状況と弱点を分析します。</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総受験回数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attempts?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均合格率</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {deptStats.length > 0
                                ? Math.round(deptStats.reduce((acc, cur) => acc + cur.passRate, 0) / deptStats.length)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Department Ranking */}
                <Card>
                    <CardHeader>
                        <CardTitle>部署別パフォーマンス (合格率)</CardTitle>
                        <CardDescription>合格率の高い順に表示</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {deptStats.map(dept => (
                                <div key={dept.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{dept.name}</span>
                                        <span className="text-muted-foreground">{dept.passRate}% (受験数: {dept.total})</span>
                                    </div>
                                    <Progress value={dept.passRate} className="h-2" />
                                </div>
                            ))}
                            {deptStats.length === 0 && <div className="text-muted-foreground text-sm">データがありません</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Weak Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle>苦手問題ワースト5</CardTitle>
                        <CardDescription>最も多く間違えられている問題</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>問題 (抜粋)</TableHead>
                                    <TableHead className="text-right">失敗数</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {worstQuestions?.map((w: any) => (
                                    <TableRow key={w.question_id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="line-clamp-1 font-medium">{w.questions?.text}</span>
                                                <span className="text-xs text-muted-foreground">Phase: {w.questions?.phase || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-destructive">
                                            {w.failure_count}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!worstQuestions || worstQuestions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">データがありません</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
