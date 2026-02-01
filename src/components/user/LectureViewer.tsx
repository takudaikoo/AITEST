"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { completeActivity } from "@/app/actions/gamification";
import { toast } from "sonner";
import { parseAndValidateQuestions, CsvQuestionInput } from "@/lib/csv-import";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface LectureViewerProps {
    historyId: string;
    programId: string;
    title: string;
    content: string;
    videoUrl?: string; // Optional
    quizCsv?: string | null;
}

export function LectureViewer({ historyId, programId, title, content, videoUrl, quizCsv }: LectureViewerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCompleting, setIsCompleting] = useState(false);

    // Quiz State
    const [questions, setQuestions] = useState<CsvQuestionInput[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({}); // index -> answer
    const [quizStatus, setQuizStatus] = useState<'idle' | 'submitted' | 'passed' | 'failed'>('idle');
    const [score, setScore] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        if (quizCsv) {
            parseAndValidateQuestions(quizCsv).then(result => {
                if (result.errors.length === 0) {
                    setQuestions(result.data);
                } else {
                    console.error("Quiz Parse Error", result.errors);
                }
            });
        }
    }, [quizCsv]);

    const handleAnswerChange = (questionIndex: number, value: any) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: value
        }));
        // Reset status on change if we want re-submission
        if (quizStatus === 'submitted' || quizStatus === 'failed') {
            setQuizStatus('idle');
        }
    };

    const handleCheckboxChange = (questionIndex: number, optionIndex: number, checked: boolean) => {
        const current = userAnswers[questionIndex] as number[] || [];
        let next;
        if (checked) {
            next = [...current, optionIndex];
        } else {
            next = current.filter(i => i !== optionIndex);
        }
        handleAnswerChange(questionIndex, next);
    };

    const checkAnswers = () => {
        let correctCount = 0;
        let isAllCorrect = true;

        questions.forEach((q, idx) => {
            const answer = userAnswers[idx];
            let isCorrect = false;

            if (q.question_type === 'single_choice') {
                // answer is index (1-based from CSV?) no options are 0-indexed in array, but correct_indices in CSV is 1-based.
                // My parser converts 1-based csv index to 1-based correct_indices array.
                // Wait, my parser: `options.push(...)`. `correct_indices` are parsed from CSV (1-based).
                // UI inputs: I should use 1-based or 0-based? Let's stick to 1-based for matching.

                // RadioGroup value is usually string.
                if (parseInt(answer) === q.correct_indices[0]) {
                    isCorrect = true;
                }
            } else if (q.question_type === 'multiple_choice') {
                // answer is array of 1-based indices
                const userSelected = (answer as number[])?.sort() || [];
                const correct = q.correct_indices.sort();
                if (JSON.stringify(userSelected) === JSON.stringify(correct)) {
                    isCorrect = true;
                }
            } else if (q.question_type === 'text') {
                // For text, we can't really auto-grade easily without exact match. 
                // Assuming "any input" is OK or strict match if we had an answer key.
                // But CSV parser doesn't require answer key for text? 
                // Actually correct_indices is empty for text. 
                // Let's just assume valid if not empty.
                if (answer && answer.trim().length > 0) isCorrect = true;
            }

            if (isCorrect) correctCount++;
            else isAllCorrect = false;
        });

        setScore({ correct: correctCount, total: questions.length });
        setQuizStatus(isAllCorrect ? 'passed' : 'failed');

        if (isAllCorrect) {
            toast.success("全問正解です！完了できます。");
        } else {
            toast.error(`不正解があります (${correctCount}/${questions.length})`);
        }
    };


    const handleComplete = async () => {
        if (isCompleting) return;

        // Guard: Quiz check
        if (questions.length > 0 && quizStatus !== 'passed') {
            toast.error("まずは確認問題に全問正解してください");
            // Scroll to quiz
            document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setIsCompleting(true);

        try {
            // Completed via Server Action
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

            router.push(`/dashboard`);
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

            {questions.length > 0 && (
                <div id="quiz-section" className="space-y-6 border-t pt-8">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">確認テスト</h2>
                    </div>
                    <p className="text-muted-foreground">学習内容の理解度を確認しましょう。全問正解すると完了できます。</p>

                    {questions.map((q, idx) => (
                        <Card key={idx}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <Badge variant="outline">Q{idx + 1}</Badge>
                                        <div className="prose dark:prose-invert text-base leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {q.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <Badge>{q.points}pt</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {q.question_type === 'single_choice' && (
                                    <RadioGroup
                                        onValueChange={(val) => handleAnswerChange(idx, val)}
                                        value={userAnswers[idx] || ""}
                                    >
                                        {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <RadioGroupItem value={(optIdx + 1).toString()} id={`q${idx}-opt${optIdx}`} />
                                                <Label htmlFor={`q${idx}-opt${optIdx}`} className="flex-1 cursor-pointer">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {q.question_type === 'multiple_choice' && (
                                    <div className="grid gap-2">
                                        {q.options.map((opt, optIdx) => {
                                            const current = userAnswers[idx] as number[] || [];
                                            const isChecked = current.includes(optIdx + 1);
                                            return (
                                                <div key={optIdx} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        id={`q${idx}-opt${optIdx}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(c) => handleCheckboxChange(idx, optIdx + 1, !!c)}
                                                    />
                                                    <Label htmlFor={`q${idx}-opt${optIdx}`} className="flex-1 cursor-pointer">{opt}</Label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {q.question_type === 'text' && (
                                    <Input
                                        placeholder="回答を入力"
                                        value={userAnswers[idx] || ""}
                                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                    />
                                )}
                            </CardContent>
                            {(quizStatus === 'submitted' || quizStatus === 'failed' || quizStatus === 'passed') && q.explanation && (
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
                            <Button size="lg" onClick={checkAnswers} disabled={Object.keys(userAnswers).length < questions.length} className="w-full max-w-sm">
                                答え合わせをする
                            </Button>
                        )}
                    </div>
                </div>
            )}


            <div className="flex justify-center pt-8 border-t">
                {questions.length > 0 ? (
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
