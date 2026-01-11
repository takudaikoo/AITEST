"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ExamRunnerProps {
    historyId: string;
    programId: string;
    timeLimit: number | null; // in minutes
    questions: any[];
}

export function ExamRunner({ historyId, programId, timeLimit, questions }: ExamRunnerProps) {
    const router = useRouter();
    const supabase = createClient();
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

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // 1. Calculate Score (Client-side estimation for immediate feedback, but secure scoring should be server-side/RPC)
            // For this MVP, we calculate locally and save.

            let totalScore = 0;
            let obtainedScore = 0;
            const userAnswersPayload = [];
            const incorrectQuestions = [];

            for (const q of questions) {
                const userAnswer = answers[q.id];
                let isCorrect = false;

                // Logic depends on type
                if (q.question_type === 'single_choice') {
                    const correctOption = q.options.find((o: any) => o.is_correct);
                    if (correctOption && userAnswer === correctOption.id) {
                        isCorrect = true;
                    }
                } else if (q.question_type === 'multiple_choice') {
                    // userAnswer is array of option_ids
                    const correctOptions = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
                    const userSelected = Array.isArray(userAnswer) ? userAnswer : [];

                    // Exact match check
                    if (correctOptions.length === userSelected.length &&
                        correctOptions.every((id: string) => userSelected.includes(id))) {
                        isCorrect = true;
                    }
                } else {
                    // Text - Manual grading usually needed. For now assume correct or handle later?
                    // Let's mark as false for now until graded, or just ignore score.
                }

                if (isCorrect) obtainedScore += (100 / questions.length); // Simple equal weighting
                if (!isCorrect) incorrectQuestions.push(q.id);

                // Prep answer record
                userAnswersPayload.push({
                    history_id: historyId,
                    question_id: q.id,
                    selected_option_id: q.question_type === 'single_choice' ? userAnswer : null,
                    // For multiple choice we might need multiple rows or a different schema structure. 
                    // Current user_answers schema has single `selected_option_id`.
                    // FIX: If multiple choice, we likely need to insert multiple rows OR change schema.
                    // Let's handle Single Choice fully first. For Multiple, we'll serialize or insert multiple.
                    // Schema correction: `user_answers` has `selected_option_id`.
                    // If multiple choice, we need to insert multiple rows for the same question_id?
                    // Yes, standard way.
                    is_correct: isCorrect,
                    text_answer: q.question_type === 'text' ? userAnswer : null
                });
            }

            // Handle Multiple Choice inserts properly
            const finalPayload = [];
            for (const q of questions) {
                const ans = answers[q.id];
                if (q.question_type === 'multiple_choice' && Array.isArray(ans)) {
                    for (const optId of ans) {
                        // We need to re-evaluate is_correct per option? No, usually is_correct is per question answer set.
                        // Let's simplified: is_correct is false unless fully correct.
                        // We will rely on history 'score' for the Pass/Fail.
                        finalPayload.push({
                            history_id: historyId,
                            question_id: q.id,
                            selected_option_id: optId,
                            is_correct: false // Logic too complex for single row boolean without context
                        });
                    }
                } else {
                    finalPayload.push({
                        history_id: historyId,
                        question_id: q.id,
                        selected_option_id: q.question_type === 'single_choice' ? ans : null,
                        text_answer: q.question_type === 'text' ? ans : null,
                        is_correct: false // Need strict check
                    });
                }
            }

            // Save Answers
            const { error: ansError } = await supabase.from("user_answers").insert(finalPayload);
            if (ansError) throw ansError;

            // Track Weaknesses (Upsert logic)
            if (incorrectQuestions.length > 0) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    for (const qId of incorrectQuestions) {
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
            }

            // Update History
            const passed = obtainedScore >= 80; // Hardcoded or from program.passing_score
            await supabase.from("learning_history").update({
                score: Math.round(obtainedScore),
                is_passed: passed,
                status: 'completed',
                completed_at: new Date().toISOString()
            }).eq("id", historyId);

            // Gamification: Award XP if passed
            if (passed) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const xpGained = 100; // Fixed amount for now
                    // Simple read-modify-write
                    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
                    if (profile) {
                        await supabase.from('profiles').update({
                            xp: (profile.xp || 0) + xpGained
                        }).eq('id', user.id);
                    }
                }
            }

            // Redirect to Result
            router.push(`/dashboard/history/${historyId}`);

        } catch (e) {
            console.error(e);
            alert("送信に失敗しました");
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
                    <CardTitle className="text-lg leading-relaxed">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {currentQuestion.question_type === 'single_choice' && (
                        <RadioGroup
                            value={answers[currentQuestion.id] || ""}
                            onValueChange={(val) => handleOptionSelect(currentQuestion.id, val)}
                        >
                            {currentQuestion.options?.map((opt: any) => (
                                <div key={opt.id} className="flex items-center space-x-2 border rounded p-4 cursor-pointer hover:bg-accent">
                                    <RadioGroupItem value={opt.id} id={opt.id} />
                                    <Label htmlFor={opt.id} className="flex-1 cursor-pointer">{opt.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'text' && (
                        <Textarea
                            placeholder="回答を入力..."
                            className="min-h-[200px]"
                            value={answers[currentQuestion.id] || ""}
                            onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
                        />
                    )}

                    {currentQuestion.question_type === 'multiple_choice' && (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((opt: any) => {
                                const currentSelected = (answers[currentQuestion.id] || []) as string[];
                                const isChecked = currentSelected.includes(opt.id);
                                return (
                                    <div key={opt.id} className="flex items-center space-x-2 border rounded p-4">
                                        <Checkbox
                                            id={opt.id}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    handleOptionSelect(currentQuestion.id, [...currentSelected, opt.id]);
                                                } else {
                                                    handleOptionSelect(currentQuestion.id, currentSelected.filter(id => id !== opt.id));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={opt.id} className="flex-1 cursor-pointer">{opt.text}</Label>
                                    </div>
                                )
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
