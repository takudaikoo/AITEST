import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

interface HistoryDetailPageProps {
    params: {
        id: string; // history_id
    };
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: history } = await supabase
        .from("learning_history")
        .select(`
      *,
      programs ( title, passing_score ),
      user_answers (
        question_id, is_correct, selected_option_id, text_answer,
        questions ( text, explanation, options (id, text, is_correct) )
      )
    `)
        .eq("id", params.id)
        .single();

    if (!history) return notFound();

    // Calculate specific analytics if needed
    const passingScore = history.programs?.passing_score || 80;
    const isPassed = history.score >= passingScore;

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">試験結果: {history.programs?.title}</h1>
                <Button variant="outline" asChild>
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> ダッシュボードへ</Link>
                </Button>
            </div>

            <Card className={isPassed ? "border-green-500 bg-green-50/10" : "border-red-500 bg-red-50/10"}>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    {isPassed ? (
                        <CheckCircle2 className="h-24 w-24 text-green-500" />
                    ) : (
                        <XCircle className="h-24 w-24 text-red-500" />
                    )}
                    <h2 className="text-4xl font-extrabold">{history.score}点</h2>
                    <div className="text-xl font-medium">
                        {isPassed ? <span className="text-green-500">合格！おめでとうございます</span> : <span className="text-red-500">不合格... 再挑戦しましょう</span>}
                    </div>
                    <p className="text-muted-foreground">合格ライン: {passingScore}点</p>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h3 className="text-xl font-semibold">回答の振り返り</h3>
                {history.user_answers?.map((ans: any, index: number) => {
                    // Determine if this answer row is correct.
                    // Note: Schema structure for m-choice might have multiple rows. 
                    // Visualization here assumes single choice simple view for now.
                    const question = ans.questions;
                    const isCorrect = ans.is_correct; // If we trusted client logic

                    return (
                        <Card key={index} className="overflow-hidden">
                            <CardHeader className="bg-secondary/20 pb-4">
                                <div className="flex items-start gap-4">
                                    <Badge variant={isPassed ? "default" : "destructive"} className="mt-1">Q{index + 1}</Badge>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-base">{question.text}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium text-muted-foreground">あなたの回答</span>
                                        <div className="p-3 rounded-md border bg-background">
                                            {/* Resolve Option Text */}
                                            {question.options?.find((o: any) => o.id === ans.selected_option_id)?.text || ans.text_answer || "未回答"}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium text-muted-foreground">正解</span>
                                        <div className="p-3 rounded-md border bg-muted/50">
                                            {question.options?.filter((o: any) => o.is_correct).map((o: any) => o.text).join(", ")}
                                        </div>
                                    </div>
                                </div>

                                {question.explanation && (
                                    <div className="mt-4 rounded-md bg-blue-50/10 p-4 text-sm">
                                        <span className="font-semibold block mb-1">解説:</span>
                                        {question.explanation}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
