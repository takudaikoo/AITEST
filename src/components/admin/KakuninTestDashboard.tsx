"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, Users, Trophy, BarChart2 } from "lucide-react";

interface Props {
    program: { id: string; title: string; xp_reward: number } | null;
    users: any[];
    departments: { id: string; name: string }[];
    attempts: any[]; // {id, user_id, score, is_passed, started_at}
}

export function KakuninTestDashboard({ program, users, departments, attempts }: Props) {
    const [deptFilter, setDeptFilter] = useState("all");

    // 部署名マップ
    const deptMap = useMemo(() => {
        const m = new Map<string, string>();
        departments.forEach(d => m.set(d.id, d.name));
        return m;
    }, [departments]);

    // 最新受験結果マップ (user_id -> attempt)
    const latestAttemptMap = useMemo(() => {
        const m = new Map<string, any>();
        // attempts は started_at 降順なので最初が最新
        for (const a of attempts) {
            if (!m.has(a.user_id)) m.set(a.user_id, a);
        }
        return m;
    }, [attempts]);

    // フィルター後のユーザーリスト
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (deptFilter === "all") return true;
            return u.department_id === deptFilter;
        });
    }, [users, deptFilter]);

    // 統計
    const stats = useMemo(() => {
        const total = users.length;
        const taken = new Set(attempts.map(a => a.user_id)).size;
        const latestList = Array.from(latestAttemptMap.values());
        const passed = latestList.filter(a => a.is_passed).length;
        const scores = latestList.map(a => a.score).filter((s): s is number => s !== null);
        const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
        return { total, taken, notTaken: total - taken, passed, failed: taken - passed, avg };
    }, [users, attempts, latestAttemptMap]);

    const receiptRate = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;

    // 表示用ユーザー行
    const rows = useMemo(() => {
        return filteredUsers.map(u => {
            const attempt = latestAttemptMap.get(u.id);
            const deptName = u.departments?.name ?? deptMap.get(u.department_id) ?? "—";
            return {
                id: u.id,
                name: u.full_name || "—",
                dept: deptName,
                taken: !!attempt,
                score: attempt?.score ?? null,
                passed: attempt?.is_passed ?? null,
                date: attempt?.started_at ? new Date(attempt.started_at).toLocaleDateString("ja-JP") : null,
            };
        }).sort((a, b) => {
            // 未受験を先に
            if (a.taken !== b.taken) return a.taken ? 1 : -1;
            // 受験済みは点数降順
            if (a.score !== null && b.score !== null) return b.score - a.score;
            return 0;
        });
    }, [filteredUsers, latestAttemptMap, deptMap]);

    if (!program) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                確認テストがDBに登録されていません。
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* サマリーカード */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">受講率</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{receiptRate}%</div>
                        <Progress value={receiptRate} className="h-1.5 mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">{stats.taken} / {stats.total} 名</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">未受験</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.notTaken} 名</div>
                        <p className="text-xs text-muted-foreground mt-1">まだ受験していません</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">合格 / 不合格</CardTitle>
                        <Trophy className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <span className="text-green-600">{stats.passed}</span>
                            <span className="text-base font-normal text-muted-foreground mx-1">/</span>
                            <span className="text-red-500">{stats.failed}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">合格基準: 80点以上</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">平均点</CardTitle>
                        <BarChart2 className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avg !== null ? `${stats.avg} 点` : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">受験者のみ</p>
                    </CardContent>
                </Card>
            </div>

            {/* テーブル */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">受講者一覧</CardTitle>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="部署で絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部署</SelectItem>
                            {departments.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">氏名</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">部署</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">受験状況</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">点数</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">合否</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">受験日</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        className={`border-b last:border-0 transition-colors ${!row.taken ? "bg-amber-50/40 dark:bg-amber-900/5" : "hover:bg-muted/30"}`}
                                    >
                                        <td className="px-4 py-3 font-medium">{row.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.dept}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.taken ? (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> 受験済み
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1">
                                                    <Clock className="h-3 w-3" /> 未受験
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.score !== null ? (
                                                <span className={`font-bold text-base ${row.score >= 80 ? "text-green-600" : "text-red-500"}`}>
                                                    {row.score}点
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.passed === true && (
                                                <Badge className="bg-green-500/15 text-green-700 border-0 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> 合格
                                                </Badge>
                                            )}
                                            {row.passed === false && (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 gap-1">
                                                    <XCircle className="h-3 w-3" /> 不合格
                                                </Badge>
                                            )}
                                            {row.passed === null && <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                                            {row.date ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            該当するユーザーがいません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
