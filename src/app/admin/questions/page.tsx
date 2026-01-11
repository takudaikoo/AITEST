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
import { QuestionImporter } from "../../../components/admin/questions/QuestionImporter";

export default async function QuestionsPage() {
    const supabase = createClient();

    // Fetch all questions
    const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">問題管理</h2>
                <div className="flex items-center gap-2">
                    <QuestionImporter />
                    {/* Manual add button - potentially linking to a new standalone question form page if needed, 
                        but for now let's focus on CSV or keep the modal logic if adaptable. 
                        Actually, user asked to separate screens. So a new /admin/questions/new page is best. 
                    */}
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
                            <TableHead className="w-[400px]">問題文</TableHead>
                            <TableHead>形式</TableHead>
                            <TableHead>難易度</TableHead>
                            <TableHead>配点</TableHead>
                            <TableHead>作成日</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    問題が登録されていません。
                                </TableCell>
                            </TableRow>
                        )}
                        {questions?.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell className="font-medium truncate max-w-[400px]">{q.text}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {q.question_type === 'single_choice' ? '単一選択' :
                                            q.question_type === 'multiple_choice' ? '複数選択' : '記述式'}
                                    </Badge>
                                </TableCell>
                                <TableCell>Lv.{q.difficulty}</TableCell>
                                <TableCell>{q.points}点</TableCell>
                                <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
