"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { completeActivity } from "@/app/actions/gamification";
import { buildAnswerSnapshot } from "@/lib/answer-snapshot";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface QuizOption {
    id: string;
    text: string;
    is_correct?: boolean;
}

interface QuizQuestion {
    id: string;
    text: string;
    question_type: string;
    explanation?: string | null;
    options: QuizOption[];
}

interface LectureViewerProps {
    historyId: string;
    programId: string;
    title: string;
    content: string;
    videoUrl?: string; // Optional
    questions?: QuizQuestion[];
}

// 1問の正誤判定（答え合わせ表示と回答保存の両方で使用）
function computeIsCorrect(q: QuizQuestion, answer: any): boolean {
    if (q.question_type === 'single_choice') {
        const correct = q.options.find(o => o.is_correct);
        return !!correct && answer === correct.id;
    }
    if (q.question_type === 'multiple_choice') {
        const correctIds = q.options.filter(o => o.is_correct).map(o => o.id).sort();
        const selected = (Array.isArray(answer) ? [...answer] : []).sort();
        return correctIds.length > 0
            && correctIds.length === selected.length
            && correctIds.every((id, i) => id === selected[i]);
    }
    if (q.question_type === 'text') {
        return typeof answer === 'string' && answer.trim().length > 0;
    }
    return false;
}

export function LectureViewer({ historyId, title, content, videoUrl, questions = [] }: LectureViewerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCompleting, setIsCompleting] = useState(false);

    // Quiz State (question_id -> answer)
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [quizStatus, setQuizStatus] = useState<'idle' | 'passed' | 'failed'>('idle');
    const [score, setScore] = useState({ correct: 0, total: 0 });

    const hasQuiz = questions.length > 0;

    const setAnswer = (qId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
        // 回答変更時は再提出できるよう判定をリセット
        if (quizStatus !== 'idle') setQuizStatus('idle');
    };

    const toggleMulti = (qId: string, optId: string, checked: boolean) => {
        const current = (answers[qId] as string[]) || [];
        const next = checked ? [...current, optId] : current.filter(i => i !== optId);
        setAnswer(qId, next);
    };

    const allAnswered = questions.every(q => {
        const a = answers[q.id];
        if (Array.isArray(a)) return a.length > 0;
        return a !== undefined && a !== null && String(a).trim() !== '';
    });

    const checkAnswers = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (computeIsCorrect(q, answers[q.id])) correctCount++;
        });
        setScore({ correct: correctCount, total: questions.length });
        const allCorrect = correctCount === questions.length;
        setQuizStatus(allCorrect ? 'passed' : 'failed');
        if (allCorrect) {
            toast.success("全問正解です！完了できます。");
        } else {
            toast.error(`不正解があります (${correctCount}/${questions.length})`);
        }
    };

    // 回答結果を後から確認できるよう、受験時点のスナップショットを保存する。
    // （共有 questions テーブルにAIの問題が無く user_answers が保存できないため、
    //   learning_history.program_snapshot_type に JSON として保持する）
    const saveSnapshot = async () => {
        try {
            const snapshot = buildAnswerSnapshot(questions, answers, computeIsCorrect);
            const { error } = await supabase.from("learning_history")
                .update({ program_snapshot_type: JSON.stringify(snapshot) })
                .eq("id", historyId);
            if (error) console.error("Failed to save answer snapshot:", error);
        } catch (e) {
            console.error("Failed to save answer snapshot:", e);
        }
    };

    const handleComplete = async () => {
        if (isCompleting) return;

        // Guard: Quiz check
        if (hasQuiz && quizStatus !== 'passed') {
            toast.error("まずは確認問題に全問正解してください");
            document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setIsCompleting(true);

        try {
            if (hasQuiz) await saveSnapshot();

            const result = await completeActivity(
                historyId,
                100, // Full score
                true // Always passed
            );

            if (!result.success) {
                console.error(result.error);
                toast.error("完了処理に失敗しました");
            } else {
                if (result.isRankUp) {
                    toast.success(`🎉 ランクアップ！ ${result.newRank} に昇格しました！ (+${result.xpGained} XP)`, {
                        duration: 5000,
                    });
                } else if (result.xpGained > 0) {
                    toast.success(`お疲れ様でした！ +${result.xpGained} XP 獲得しました！`);
                } else {
                    toast.success("学習を完了しました！");
                }
            }

            // 確認テストありの講習は回答結果を確認できるよう結果画面へ
            router.push(hasQuiz ? `/dashboard/history/${historyId}` : `/dashboard`);
            router.refresh();
        } catch (e) {
            console.error(e);
            setIsCompleting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>学習コンテンツ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Placeholder for Video Embed */}
                    {videoUrl && (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            Video Player Placeholder
                        </div>
                    )}

                    {/* Markdown Content */}
                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content || "コンテンツがありません。"}
                        </ReactMarkdown>
                    </div>
                </CardContent>
            </Card>

            {hasQuiz && (
                <div id="quiz-section" className="space-y-6 border-t pt-8">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">確認テスト</h2>
                    </div>
                    <p className="text-muted-foreground">学習内容の理解度を確認しましょう。全問正解すると完了できます。</p>

                    {questions.map((q, idx) => (
                        <Card key={q.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2">
                                        <Badge variant="outline">Q{idx + 1}</Badge>
                                        <div className="prose dark:prose-invert text-base leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {q.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {q.question_type === 'single_choice' && (
                                    <RadioGroup
                                        onValueChange={(val) => setAnswer(q.id, val)}
                                        value={answers[q.id] || ""}
                                    >
                                        {q.options.map((opt) => (
                                            <div key={opt.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <RadioGroupItem value={opt.id} id={`q${q.id}-opt${opt.id}`} />
                                                <Label htmlFor={`q${q.id}-opt${opt.id}`} className="flex-1 cursor-pointer">{opt.text}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {q.question_type === 'multiple_choice' && (
                                    <div className="grid gap-2">
                                        {q.options.map((opt) => {
                                            const current = (answers[q.id] as string[]) || [];
                                            const isChecked = current.includes(opt.id);
                                            return (
                                                <div key={opt.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        id={`q${q.id}-opt${opt.id}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(c) => toggleMulti(q.id, opt.id, !!c)}
                                                    />
                                                    <Label htmlFor={`q${q.id}-opt${opt.id}`} className="flex-1 cursor-pointer">{opt.text}</Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {q.question_type === 'text' && (
                                    <Input
                                        placeholder="回答を入力"
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswer(q.id, e.target.value)}
                                    />
                                )}
                            </CardContent>
                            {quizStatus !== 'idle' && q.explanation && (
                                <CardFooter className="bg-muted/50 block p-4">
                                    <p className="font-semibold text-sm mb-1">解説:</p>
                                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                </CardFooter>
                            )}
                        </Card>
                    ))}

                    <div className="flex justify-center flex-col items-center gap-4">
                        {quizStatus === 'failed' && (
                            <Alert variant="destructive" className="max-w-md">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>不合格</AlertTitle>
                                <AlertDescription>
                                    正解数: {score.correct} / {score.total} <br />
                                    もう一度見直して挑戦しましょう。
                                </AlertDescription>
                            </Alert>
                        )}
                        {quizStatus === 'passed' && (
                            <Alert className="max-w-md border-green-500 bg-green-50 text-green-900">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle>合格！</AlertTitle>
                                <AlertDescription>
                                    おめでとうございます！学習を完了できます。
                                </AlertDescription>
                            </Alert>
                        )}

                        {quizStatus !== 'passed' && (
                            <Button size="lg" onClick={checkAnswers} disabled={!allAnswered} className="w-full max-w-sm">
                                答え合わせをする
                            </Button>
                        )}
                    </div>
                </div>
            )}


            <div className="flex justify-center pt-8 border-t">
                {hasQuiz ? (
                    <Button
                        size="lg"
                        onClick={handleComplete}
                        disabled={isCompleting || quizStatus !== 'passed'}
                        className="gap-2 w-full max-w-sm"
                        variant={quizStatus === 'passed' ? 'default' : 'secondary'}
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        学習を完了する
                    </Button>
                ) : (
                    <Button size="lg" onClick={handleComplete} disabled={isCompleting} className="gap-2 w-full max-w-sm">
                        <CheckCircle2 className="h-5 w-5" />
                        学習を完了する
                    </Button>
                )}
            </div>
        </div>
    );
}
