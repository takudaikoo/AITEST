"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, BrainCircuit, TrendingUp } from "lucide-react";
import { RecentActivityChart } from "@/components/admin/dashboard/RecentActivityChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardClientProps {
    stats: {
        usersCount: number;
        totalAttempts: number;
        formattedAttempts: string;
        avgRankLabel: string;
        avgScore: number;
        completionRate: number;
        completedCount: number;
    };
    chartData: { name: string; total: number }[];
    rankings: {
        byScore: { name: string; value: number }[];
        byXP: { name: string; value: number }[];
    };
}

export function DashboardClient({ stats, chartData, rankings }: DashboardClientProps) {
    const [rankingMode, setRankingMode] = useState<"score" | "xp">("score");

    const currentRanking = rankingMode === "score" ? rankings.byScore : rankings.byXP;

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
                        <div className="text-2xl font-bold">{stats.usersCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総試験回数</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.formattedAttempts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均AIランク</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgRankLabel}</div>
                        <p className="text-xs text-muted-foreground">平均ランクスコア: {stats.avgScore.toFixed(1)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">完了率</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completionRate}%</div>
                        <p className="text-xs text-muted-foreground">完了数: {stats.completedCount}</p>
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>部署別ランキング</CardTitle>
                        <Select value={rankingMode} onValueChange={(v: any) => setRankingMode(v)}>
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="score">平均スコア順</SelectItem>
                                <SelectItem value="xp">合計XP順</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {currentRanking.length === 0 && <p className="text-sm text-muted-foreground">データがありません</p>}
                            {currentRanking.map((dept, index) => (
                                <div key={dept.name} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{dept.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {rankingMode === "score" ? `平均スコア: ${dept.value}点` : `合計XP: ${dept.value.toLocaleString()} XP`}
                                        </p>
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
