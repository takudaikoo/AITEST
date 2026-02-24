"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { completeActivity } from "@/app/actions/gamification";
import { toast } from "sonner";

interface ExamRunnerProps {
    historyId: string;
    programId: string;
    timeLimit: number | null; // in minutes
    questions: any[];
}

export function ExamRunner({ historyId, programId, timeLimit, questions }: ExamRunnerProps) {
    const router = useRouter();
    const supabase = useRef(createClient()).current;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({}); // question_id -> answer
    const [timeLeft, setTimeLeft] = useState<number | null>(timeLimit ? timeLimit * 60 : null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Timer Effect
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            handleSubmit(); // Auto-submit
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const [gradingResults, setGradingResults] = useState<Record<string, { isCorrect: boolean, score: number, feedback: string }>>({});
    const [isGrading, setIsGrading] = useState(false);

    const handleOptionSelect = (questionId: string, value: string | string[]) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleAIGrading = async () => {
        if (!currentQuestion || currentQuestion.question_type !== 'text') return;
        const answer = answers[currentQuestion.id];
        if (!answer || answer.trim().length === 0) {
            alert("回答を入力してください");
            return;
        }

        setIsGrading(true);
        try {
            const res = await fetch("/api/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionText: currentQuestion.text,
                    userAnswer: answer,
                    gradingPrompt: currentQuestion.grading_prompt, // Passed from parent
                    explanation: currentQuestion.explanation
                })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            setGradingResults(prev => ({
                ...prev,
                [currentQuestion.id]: data
            }));

        } catch (error) {
            console.error(error);
            alert("採点に失敗しました");
        } finally {
            setIsGrading(false);
        }
    };

    const isUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let obtainedScore = 0;
            const finalPayload: any[] = [];
            const incorrectQuestions: string[] = [];

            for (const q of questions) {
                const userAnswer = answers[q.id];
                let isCorrect = false;

                // 1. Logic for Correctness
                if (q.question_type === 'single_choice') {
                    const correctOption = q.options.find((o: any) => o.is_correct);
                    if (correctOption && userAnswer === correctOption.id) {
                        isCorrect = true;
                    }
                } else if (q.question_type === 'multiple_choice') {
                    const correctOptions = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
                    const userSelected = Array.isArray(userAnswer) ? userAnswer : [];
                    if (correctOptions.length === userSelected.length &&
                        correctOptions.every((id: string) => userSelected.includes(id))) {
                        isCorrect = true;
                    }
                } else if (q.question_type === 'text') {
                    const result = gradingResults[q.id];
                    if (result && result.isCorrect) {
                        isCorrect = true;
                    }
                }

                if (isCorrect) obtainedScore += (100 / questions.length);
                else incorrectQuestions.push(q.id);

                // 2. Prep Payload for DB (Only if IDs are UUIDs)
                if (isUUID(historyId) && isUUID(q.id)) {
                    if (q.question_type === 'multiple_choice' && Array.isArray(userAnswer)) {
                        for (const optId of userAnswer) {
                            if (isUUID(optId)) {
                                finalPayload.push({
                                    history_id: historyId,
                                    question_id: q.id,
                                    selected_option_id: optId,
                                    is_correct: isCorrect // Overall question correctness
                                });
                            }
                        }
                    } else {
                        // For non-UUID option ids (like CSV), selected_option_id will be null in DB
                        const optId = (q.question_type === 'single_choice' && typeof userAnswer === 'string' && isUUID(userAnswer)) ? userAnswer : null;

                        finalPayload.push({
                            history_id: historyId,
                            question_id: q.id,
                            selected_option_id: optId,
                            text_answer: q.question_type === 'text' ? userAnswer : null,
                            is_correct: isCorrect
                        });
                    }
                }
            }

            // Save Answers (If any valid ones)
            if (finalPayload.length > 0) {
                const { error: ansError } = await supabase.from("user_answers").insert(finalPayload);
                if (ansError) {
                    console.error("Failed to insert user_answers:", ansError);
                    // We continue anyway so history is updated, but log it
                }
            }

            // Track Weaknesses
            const { data: { user } } = await supabase.auth.getUser();
            if (user && incorrectQuestions.length > 0) {
                for (const qId of incorrectQuestions) {
                    if (!isUUID(qId)) continue;
                    try {
                        const { data: existing } = await supabase
                            .from('weaknesses')
                            .select('failure_count')
                            .eq('user_id', user.id)
                            .eq('question_id', qId)
                            .maybeSingle();

                        const newCount = (existing?.failure_count || 0) + 1;
                        await supabase.from('weaknesses').upsert({
                            user_id: user.id,
                            question_id: qId,
                            failure_count: newCount,
                            last_failed_at: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error("Weakness update failed", err);
                    }
                }
            }

            // Update History
            const passed = Math.round(obtainedScore) >= 80;
            const result = await completeActivity(
                historyId,
                Math.round(obtainedScore),
                passed
            );

            if (!result.success) {
                console.error(result.error);
                toast.error("結果の保存に失敗しました: " + result.error);
            } else {
                if (passed) {
                    if (result.isRankUp) {
                        toast.success(`🎉 ランクアップ！ ${result.newRank} に昇格しました！ (+${result.xpGained} XP)`, { duration: 5000 });
                    } else if (result.xpGained > 0) {
                        toast.success(`👏 合格！ +${result.xpGained} XP 獲得しました！`);
                    } else {
                        toast.success("試験完了！");
                    }
                } else {
                    toast.info("お疲れ様でした。不合格です。");
                }
            }

            router.push(`/dashboard/history/${historyId}`);

        } catch (e: any) {
            console.error(e);
            alert("送信に失敗しました: " + (e.message || "Unknown error"));
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!currentQuestion) return <div>Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        問題 {currentQuestionIndex + 1} / {questions.length}
                    </h2>
                    <Progress value={progress} className="w-[200px]" />
                </div>
                {timeLeft !== null && (
                    <div className={cn("text-xl font-mono font-bold", timeLeft < 60 && "text-destructive")}>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg leading-relaxed">
                        <div className="prose dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentQuestion.text}
                            </ReactMarkdown>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {currentQuestion.question_type === 'single_choice' && (
                        <RadioGroup
                            value={answers[currentQuestion.id] || ""}
                            onValueChange={(val) => handleOptionSelect(currentQuestion.id, val)}
                        >
                            {currentQuestion.options?.map((opt: any) => {
                                const optionId = `${currentQuestion.id}-${opt.id}`;
                                return (
                                    <div
                                        key={opt.id}
                                        className="flex items-center space-x-2 border rounded p-4 cursor-pointer hover:bg-accent has-[:checked]:bg-accent"
                                        onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                    >
                                        <RadioGroupItem value={opt.id} id={optionId} />
                                        <Label htmlFor={optionId} className="flex-1 cursor-pointer font-normal">
                                            {opt.text}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'text' && (
                        <div className="space-y-4">
                            <Textarea
                                placeholder="回答を入力..."
                                className="min-h-[150px]"
                                value={answers[currentQuestion.id] || ""}
                                onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
                            />

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleAIGrading}
                                    disabled={isGrading || !answers[currentQuestion.id]}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    {isGrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-yellow-500" />}
                                    AI採点実行
                                </Button>
                            </div>

                            {gradingResults[currentQuestion.id] && (
                                <Alert className={cn("mt-4", gradingResults[currentQuestion.id].isCorrect ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10")}>
                                    {gradingResults[currentQuestion.id].isCorrect ?
                                        <CheckCircle className="h-4 w-4 text-green-500" /> :
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    }
                                    <AlertTitle className={gradingResults[currentQuestion.id].isCorrect ? "text-green-500" : "text-red-500"}>
                                        {gradingResults[currentQuestion.id].isCorrect ? "正解" : "不正解"}
                                    </AlertTitle>
                                    <AlertDescription className="mt-2 text-foreground">
                                        {gradingResults[currentQuestion.id].feedback}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {currentQuestion.question_type === 'multiple_choice' && (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((opt: any) => {
                                const currentSelected = (answers[currentQuestion.id] || []) as string[];
                                const isChecked = currentSelected.includes(opt.id);
                                const optionId = `${currentQuestion.id}-${opt.id}`;

                                const toggleSelection = () => {
                                    if (isChecked) {
                                        handleOptionSelect(currentQuestion.id, currentSelected.filter(id => id !== opt.id));
                                    } else {
                                        handleOptionSelect(currentQuestion.id, [...currentSelected, opt.id]);
                                    }
                                };

                                return (
                                    <div
                                        key={opt.id}
                                        className="flex items-center space-x-2 border rounded p-4 cursor-pointer hover:bg-accent has-[:checked]:bg-accent"
                                        onClick={toggleSelection}
                                    >
                                        <Checkbox
                                            id={optionId}
                                            checked={isChecked}
                                            onCheckedChange={toggleSelection}
                                            onClick={(e) => e.stopPropagation()} // Prevent double trigger from div onClick
                                        />
                                        <Label
                                            htmlFor={optionId}
                                            className="flex-1 cursor-pointer font-normal"
                                            onClick={(e) => e.stopPropagation()} // Prevent double trigger
                                        >
                                            {opt.text}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-between border-t p-6">
                    <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        前へ
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            試験を終了する
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>次へ</Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
