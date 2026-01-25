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
import { QuestionImporter } from "../../../components/admin/questions/QuestionImporter";

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
                <h2 className="text-3xl font-bold tracking-tight">問題管理</h2>
                <div className="flex items-center gap-2">
                    {/* <QuestionImporter /> */}
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

            {/* DEBUG MODE */}
            <div className="bg-slate-100 p-4 rounded overflow-auto max-h-[500px]">
                <pre>{JSON.stringify(questions?.slice(0, 3), null, 2)}</pre>
            </div>

            {/* 
            <div className="rounded-md border bg-card">
                <Table>
                  ... (commented out) ...
                </Table>
            </div> 
            */}
        </div>
    );
}
