"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { QuestionForm } from "@/components/admin/questions/QuestionForm";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgramQuestionsManagerProps {
    programId: string;
}

// Extended type for display
type ProgramQuestion = Question & {
    question_number: number;
    link_id: string; // id from program_questions table
};

export function ProgramQuestionsManager({ programId }: ProgramQuestionsManagerProps) {
    const [questions, setQuestions] = useState<ProgramQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const supabase = createClient();

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("program_questions")
            .select(`
        id,
        question_number,
        questions (
          id, text, question_type, phase, difficulty
        )
      `)
            .eq("program_id", programId)
            .order("question_number", { ascending: true });

        if (error) {
            console.error(error);
        } else {
            // Flatten the structure
            const formatted = data.map((item: any) => ({
                ...item.questions,
                question_number: item.question_number,
                link_id: item.id
            }));
            setQuestions(formatted);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuestions();
    }, [programId]);

    const handleDelete = async (linkId: string) => {
        if (!confirm("このプログラムから問題を削除しますか？(問題自体は削除されません)")) return;

        await supabase.from("program_questions").delete().eq("id", linkId);
        fetchQuestions();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">問題一覧</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            問題を追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>新しい問題を作成</DialogTitle>
                        </DialogHeader>
                        <QuestionForm
                            programId={programId}
                            onSuccess={() => {
                                setIsDialogOpen(false);
                                fetchQuestions();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {questions.length === 0 ? (
                    <div className="p-8 text-center border rounded-md border-dashed text-muted-foreground">
                        問題がまだ登録されていません。
                    </div>
                ) : (
                    questions.map((q, index) => (
                        <Card key={q.link_id} className="relative group">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="mt-1 text-muted-foreground cursor-grab">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-8 justify-center">
                                            Q{index + 1}
                                        </Badge>
                                        <Badge className="text-xs" variant="secondary">
                                            {q.question_type === 'single_choice' ? '単一選択' :
                                                q.question_type === 'multiple_choice' ? '複数選択' : '記述'}
                                        </Badge>
                                        {(q.phase || q.difficulty) && (
                                            <span className="text-xs text-muted-foreground">
                                                (Ph:{q.phase || '-'} / Lv:{q.difficulty || '-'})
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm line-clamp-2">{q.text}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(q.link_id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
