"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Loader2, Plus, Trash } from "lucide-react";

// Schema for a single option
const optionSchema = z.object({
    text: z.string().min(1, "選択肢を入力してください"),
    is_correct: z.boolean().default(false),
});

const formSchema = z.object({
    text: z.string().min(5, "問題文は5文字以上で入力してください"),
    question_type: z.enum(["single_choice", "multiple_choice", "text"]),
    explanation: z.string().optional(),
    resource_url: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
    phase: z.coerce.number().min(1).max(7).optional(),
    difficulty: z.coerce.number().min(1).max(5).optional(),
    points: z.coerce.number().min(0).default(10),
    review_program_id: z.string().optional(),
    options: z.array(optionSchema).optional(),
});

interface QuestionFormProps {
    programId: string;
    onSuccess: () => void;
}

export function QuestionForm({ programId, onSuccess }: QuestionFormProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            text: "",
            question_type: "single_choice",
            explanation: "",
            resource_url: "",
            phase: 1,
            phase: 1,
            difficulty: 1,
            points: 10,
            review_program_id: "",
            options: [
                { text: "", is_correct: true },
                { text: "", is_correct: false },
            ],
        },
    });

    const watchType = form.watch("question_type");
    const watchOptions = form.watch("options");

    // Helper to add/remove options
    const addOption = () => {
        const currentOptions = form.getValues("options") || [];
        form.setValue("options", [...currentOptions, { text: "", is_correct: false }]);
    };

    const removeOption = (index: number) => {
        const currentOptions = form.getValues("options") || [];
        if (currentOptions.length <= 2) return;
        form.setValue("options", currentOptions.filter((_, i) => i !== index));
    };

    const setCorrectOption = (index: number) => {
        const currentOptions = form.getValues("options") || [];
        if (watchType === 'single_choice') {
            // Logic for single choice: only one true
            const newOptions = currentOptions.map((opt, i) => ({
                ...opt,
                is_correct: i === index
            }));
            form.setValue("options", newOptions);
        } else {
            // Logic for multiple choice: toggle
            const newOptions = [...currentOptions];
            newOptions[index].is_correct = !newOptions[index].is_correct;
            form.setValue("options", newOptions);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            // 1. Insert Question
            const { data: question, error: qError } = await supabase
                .from("questions")
                .insert([{
                    text: values.text,
                    question_type: values.question_type,
                    explanation: values.explanation,
                    resource_url: values.resource_url || null,
                    phase: values.phase,
                    resource_url: values.resource_url || null,
                    phase: values.phase,
                    difficulty: values.difficulty,
                    points: values.points,
                    review_program_id: values.review_program_id || null
                }])
                .select()
                .single();

            if (qError) throw qError;
            if (!question) throw new Error("Failed to create question");

            // 2. Insert Options (if choice type)
            if (values.question_type !== 'text' && values.options && values.options.length > 0) {
                const optionsToInsert = values.options.map(opt => ({
                    question_id: question.id,
                    text: opt.text,
                    is_correct: opt.is_correct
                }));

                const { error: oError } = await supabase.from("options").insert(optionsToInsert);
                if (oError) throw oError;
            }

            // 3. Link to Program (Many-to-Many)
            // Get current max question_number
            const { count } = await supabase
                .from("program_questions")
                .select("*", { count: 'exact', head: true })
                .eq("program_id", programId);

            const nextNumber = (count || 0) + 1;

            const { error: linkError } = await supabase.from("program_questions").insert({
                program_id: programId,
                question_id: question.id,
                question_number: nextNumber
            });

            if (linkError) throw linkError;

            form.reset();
            onSuccess();

        } catch (error) {
            console.error(error);
            alert("問題の作成に失敗しました");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>問題文</FormLabel>
                            <FormControl>
                                <Textarea placeholder="問題を入力してください" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="question_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>形式</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="形式を選択" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="single_choice">単一選択 (Single Choice)</SelectItem>
                                        <SelectItem value="multiple_choice">複数選択 (Multiple Choice)</SelectItem>
                                        <SelectItem value="text">記述式 (Text)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>フェーズ (1-7)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={7} {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>難易度 (1-5)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={5} {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="points"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>配点</FormLabel>
                                <FormControl>
                                    <Input type="number" min={0} {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/* For now, text input for Program ID until we have a selector */}
                    <FormField
                        control={form.control}
                        name="review_program_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>復習用プログラムID (任意)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Lecture Program ID" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {watchType !== 'text' && (
                    <div className="space-y-4">
                        <FormLabel>選択肢 ({watchType === 'single_choice' ? '正解を1つ選択' : '正解を全て選択'})</FormLabel>
                        {watchOptions?.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type={watchType === 'single_choice' ? "radio" : "checkbox"}
                                    className="h-4 w-4"
                                    checked={option.is_correct}
                                    onChange={() => setCorrectOption(index)}
                                    name="correct_option" // Group for radio
                                />
                                <Input
                                    value={option.text}
                                    onChange={(e) => {
                                        const newOptions = [...(watchOptions || [])];
                                        newOptions[index].text = e.target.value;
                                        form.setValue("options", newOptions);
                                    }}
                                    placeholder={`選択肢 ${index + 1}`}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={watchOptions.length <= 2}>
                                    <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                            <Plus className="mr-2 h-4 w-4" /> 選択肢を追加
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="explanation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>解説</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="正解・不正解時の解説" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="resource_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>参考リンク</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    問題を作成して追加
                </Button>
            </form>
        </Form>
    );
}
