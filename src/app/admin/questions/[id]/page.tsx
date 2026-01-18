
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/questions/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface EditQuestionPageProps {
    params: {
        id: string;
    };
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
    const supabase = createClient();

    // Fetch question with options
    const { data: question, error } = await supabase
        .from("questions")
        .select(`
            *,
            options (
                id, text, is_correct
            )
        `)
        .eq("id", params.id)
        .single();

    if (error || !question) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/questions">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">問題の編集</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>問題内容の修正</CardTitle>
                </CardHeader>
                <CardContent>
                    <QuestionForm
                        questionId={question.id}
                        initialData={question}
                        redirectTo="/admin/questions"
                        onSuccess={() => { }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
