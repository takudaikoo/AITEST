"use client";

import { useState, useMemo } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Users, Trophy, AlertTriangle, Filter, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsDashboardProps {
    departments: { id: string; name: string }[];
    attempts: any[];
    users: { id: string; full_name: string | null; department_id: string | null }[];
    worstQuestionsInitial: any[]; // For global view, but we might re-calc
}

export function AnalyticsDashboard({ departments, attempts, users, worstQuestionsInitial }: AnalyticsDashboardProps) {
    const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
    const [selectedUserId, setSelectedUserId] = useState<string>("all");

    // Filter Logic
    const filteredAttempts = useMemo(() => {
        return attempts.filter(a => {
            const matchesDept = selectedDeptId === "all" || a.profiles?.department_id === selectedDeptId;
            const matchesUser = selectedUserId === "all" || a.user_id === selectedUserId;
            return matchesDept && matchesUser;
        });
    }, [attempts, selectedDeptId, selectedUserId]);

    // Recalculate Stats based on filteredAttempts
    const stats = useMemo(() => {
        const total = filteredAttempts.length;
        if (total === 0) return { avgScore: 0, passRate: 0, total: 0 };

        const sumScore = filteredAttempts.reduce((acc, cur) => acc + (cur.score || 0), 0);
        const passedCount = filteredAttempts.filter(a => a.is_passed).length;

        return {
            avgScore: Math.round(sumScore / total),
            passRate: Math.round((passedCount / total) * 100),
            total
        };
    }, [filteredAttempts]);

    // Recalculate Dept Ranking (Only meaningful if "all" users selected, or specific Dept)
    // If specific User selected, Dept Ranking is less relevant, but we can show their Dept's stats.
    const deptRanking = useMemo(() => {
        // If a specific dept is selected, show only that dept? Or showing all lets you compare?
        // Let's show all depts but verify the filter context. 
        // Actually, if we filter attempts, we can aggregate those attempts by dept.

        // Strategy: Aggregate based on FILTERED attempts.
        // If Dept A is selected, only Dept A attempts exist, so only Dept A appears in list.
        const header = selectedDeptId !== "all" ? "部署ステータス" : "部署別パフォーマンス";

        const map = new Map<string, { total: number, passed: number, name: string }>();

        filteredAttempts.forEach(a => {
            const deptId = a.profiles?.department_id;
            if (!deptId) return;
            const deptName = departments.find(d => d.id === deptId)?.name || "Unknown";

            if (!map.has(deptId)) {
                map.set(deptId, { total: 0, passed: 0, name: deptName });
            }
            const curr = map.get(deptId)!;
            curr.total++;
            if (a.is_passed) curr.passed++;
        });

        return Array.from(map.values()).map(d => ({
            name: d.name,
            passRate: Math.round((d.passed / d.total) * 100),
            total: d.total
        })).sort((a, b) => b.passRate - a.passRate);

    }, [filteredAttempts, departments, selectedDeptId]);


    // Recalculate Worst Questions
    // We need 'weaknesses' table data linked to attempts? 
    // The current page fetches 'weaknesses' table directly, which is an aggregate table.
    // It doesn't link to individual attempts easily without re-querying.
    // MVP limitation: We might rely on 'worstQuestionsInitial' if we can't filter it client-side.
    // However, 'weaknesses' table is usually global counts. 
    // If we want User-specific weaknesses, we need to process 'filteredAttempts' if they contain question details?
    // 'learning_history' usually doesn't strictly contain per-question breakdown unless JSON/linked.
    // 
    // Alternative: Hide "Worst Questions" if filtering? 
    // Or just show Global Weaknesses with a note "Global"?
    // Or, if we want to be fancy, we'd need detailed logs.
    // Let's stick to Global Weaknesses for now, or hide it if it's confusing.
    // User asked for "Individual Grades", implies overall score/pass check.
    // Let's Keep "Global Worst Questions" but label it as "Global/Shared Weaknesses" or maybe just hide if User selected.

    // For now, I will display the global one but maybe alert it doesn't filter.
    // OR: I can filter `attempts` if I can see which questions failed. The schema might allow it?
    // `learning_history` likely has JSON `answers` or `weak_points`? 
    // Let's check schema. `view_file supabase/schema` was done.
    // `learning_history` has implicit structure?
    // I'll assume for MVP we just show the Global Weaknesses (static) or hide.
    // I will show them static for now.

    const filteredUsers = useMemo(() => {
        if (selectedDeptId === "all") return users;
        return users.filter(u => u.department_id === selectedDeptId);
    }, [users, selectedDeptId]);

    const handleDeptChange = (val: string) => {
        setSelectedDeptId(val);
        setSelectedUserId("all"); // Reset user when dept changes
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">絞り込み:</span>
                </div>

                <Select value={selectedDeptId} onValueChange={handleDeptChange}>
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部署</SelectItem>
                        {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="ユーザーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全員</SelectItem>
                        {filteredUsers.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || "名無し"}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(selectedDeptId !== "all" || selectedUserId !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedDeptId("all"); setSelectedUserId("all"); }}
                        className="h-9"
                    >
                        <X className="mr-2 h-4 w-4" />
                        リセット
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総受験回数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {selectedUserId !== "all" ? "選択ユーザーの合計" : "対象範囲の合計"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">合格率</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.passRate}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Department Ranking / Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedDeptId !== "all" ? "部署ステータス" : "部署別パフォーマンス"}</CardTitle>
                        <CardDescription>合格率 (受験数)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {deptRanking.map(dept => (
                                <div key={dept.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{dept.name}</span>
                                        <span className="text-muted-foreground">{dept.passRate}% ({dept.total})</span>
                                    </div>
                                    <Progress value={dept.passRate} className="h-2" />
                                </div>
                            ))}
                            {deptRanking.length === 0 && <div className="text-muted-foreground text-sm">データがありません</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Weak Questions (Static for now) */}
                <Card>
                    <CardHeader>
                        <CardTitle>苦手問題ワースト5 (全体)</CardTitle>
                        <CardDescription>※全ユーザーの集計結果です</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>問題</TableHead>
                                    <TableHead className="text-right">失敗数</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {worstQuestionsInitial?.map((w: any) => (
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
                                {(!worstQuestionsInitial || worstQuestionsInitial.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">データがありません</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* History Table (Optional/User Requested?) */}
            {/* The user asked for "Seeing individual grades". A list of attempts would be nice here. */}
            <Card>
                <CardHeader>
                    <CardTitle>受験履歴</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>日時</TableHead>
                                <TableHead>名前</TableHead>
                                <TableHead>スコア</TableHead>
                                <TableHead>合否</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttempts.slice(0, 50).map((a, i) => { // Limit 50 for render perf
                                // Need to find user name if not in attempts (attempts use `profiles` relation? query said `profiles!inner(department_id)`)
                                // The query `profiles!inner ( department_id )` might NOT return full_name unless asked.
                                // I need to update the query in page.tsx to fetch full_name.
                                const userName = a.profiles?.full_name ||
                                    users.find(u => u.id === a.user_id)?.full_name || "Unknown";

                                return (
                                    <TableRow key={i}>
                                        <TableCell>{new Date(a.created_at || Date.now()).toLocaleDateString()}</TableCell>
                                        <TableCell>{userName}</TableCell>
                                        <TableCell>{a.score}点</TableCell>
                                        <TableCell>
                                            {a.is_passed ?
                                                <span className="text-green-600 font-bold">合格</span> :
                                                <span className="text-red-500">不合格</span>
                                            }
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredAttempts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">履歴がありません</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
