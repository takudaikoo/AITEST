import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default async function HistoryPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: history, error } = await supabase
        .from("learning_history")
        .select(`
            *,
            programs ( title, passing_score, type )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                学習履歴
            </h2>

            <div className="rounded-md border bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">プログラム</TableHead>
                            <TableHead>タイプ</TableHead>
                            <TableHead>実施日</TableHead>
                            <TableHead>スコア</TableHead>
                            <TableHead>合否</TableHead>
                            <TableHead className="text-right">詳細</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!history || history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    まだ受験履歴がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((record) => {
                                const program = record.programs;
                                // Handle potentially null program (if deleted) - though cascade delete usually prevents this
                                if (!program) return null;

                                const passingScore = program.passing_score || 80;
                                const isPassed = record.score != null && record.score >= passingScore;
                                const isLecture = program.type === 'lecture';

                                return (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            {program.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize border-white/20">
                                                {program.type === 'test' ? '小テスト' :
                                                    program.type === 'exam' ? '試験' : '講習'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {record.started_at && format(new Date(record.started_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                        </TableCell>
                                        <TableCell>
                                            {record.score != null ? (
                                                <span className="font-mono text-lg">{record.score}点</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isLecture ? (
                                                <Badge variant="secondary">完了</Badge>
                                            ) : (
                                                <Badge
                                                    variant={isPassed ? "default" : "destructive"}
                                                    className={isPassed ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"}
                                                >
                                                    {isPassed ? "合格" : "不合格"}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/history/${record.id}`}>結果を見る</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
