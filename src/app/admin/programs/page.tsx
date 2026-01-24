import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

import { ProgramImportDialog } from "@/components/admin/programs/ProgramImportDialog";

export default async function ProgramsPage() {
    const supabase = createClient();
    const { data: programs, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">プログラム管理</h2>
                <div className="flex items-center gap-2">
                    <ProgramImportDialog />
                    <Button asChild>
                        <Link href="/admin/programs/new">
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
                            <TableHead>タイトル</TableHead>
                            <TableHead>タイプ</TableHead>
                            <TableHead>カテゴリー</TableHead>
                            <TableHead>ステータス</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {programs?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    プログラムがありません。
                                </TableCell>
                            </TableRow>
                        )}
                        {programs?.map((program) => (
                            <TableRow key={program.id}>
                                <TableCell className="font-medium">{program.title}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {program.type === 'test' ? '小テスト' :
                                            program.type === 'exam' ? '試験' : '講習'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{program.category || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={program.is_active ? "default" : "secondary"}>
                                        {program.is_active ? "公開中" : "下書き"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/programs/${program.id}`}>編集</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
