
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
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

export default async function QuestionsPage() {
    const supabase = createClient();

    let questions: any[] | null = [];
    let fetchError = null;

    try {
        // Fetch all questions
        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        questions = data;
    } catch (e: any) {
        console.error("Questions Fetch Error:", e);
        fetchError = e.message || JSON.stringify(e);
    }

    if (fetchError) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">エラーが発生しました</h2>
                <p className="text-muted-foreground">{fetchError}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">問題管理</h2>
                    <p className="text-muted-foreground">
                        登録されている問題の一覧です（全 {questions?.length || 0} 件）
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/admin/questions/new">
                            <Plus className="mr-2 h-4 w-4" />
                            新規作成
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>問題文</TableHead>
                            <TableHead className="w-[150px]">カテゴリー</TableHead>
                            <TableHead className="w-[100px]">タイプ</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions?.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {q.id.substring(0, 8)}...
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[500px] truncate" title={q.text}>
                                        {q.text}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{q.category || '未分類'}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{q.question_type}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/questions/${q.id}`}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!questions || questions.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    問題が登録されていません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
