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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Program, Question } from "@/types/database"; // Ensure Question is exported or defined
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "タイトルは2文字以上で入力してください。",
  }),
  description: z.string().optional(),
  type: z.enum(["test", "exam", "lecture"]),
  category: z.string().optional(),
  time_limit: z.coerce.number().min(0).optional(),
  passing_score: z.coerce.number().min(0).max(100).optional(),
  content_body: z.string().optional(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),

});

// 30分刻みの時間オプションを生成
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

interface ProgramFormProps {
  initialData?: Program;
}

// Helper: UTC string from DB -> JST string for Form (YYYY-MM-DDTHH:MM)
const toJSTString = (isoString?: string | null) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Add 9 hours to get JST time in UTC slots
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().slice(0, 16);
};

// Helper: JST string from Form -> ISO string for DB (UTC)
const fromJSTToISO = (jstString?: string | null) => {
  if (!jstString) return null;
  // Append +09:00 to treat input as JST
  const date = new Date(`${jstString}:00+09:00`);
  return date.toISOString();
};

export function ProgramForm({ initialData }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]); // Use appropriate Type
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    const fetchQuestions = async () => {
      // Fetch all questions
      const { data: allQuestions } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (allQuestions) setQuestions(allQuestions);

      // If editing, fetch existing links
      if (initialData?.id) {
        const { data: links } = await supabase.from("program_questions").select("question_id").eq("program_id", initialData.id);
        if (links) {
          setSelectedQuestionIds(new Set(links.map(l => l.question_id)));
        }
      }
    };
    fetchQuestions();
  }, [initialData, supabase]);

  const toggleQuestion = (questionId: string) => {
    const newSet = new Set(selectedQuestionIds);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSelectedQuestionIds(newSet);
  };


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "test",
      category: initialData?.category || "",
      time_limit: initialData?.time_limit || 0,
      passing_score: initialData?.passing_score || 80,
      content_body: initialData?.content_body || "",
      start_date: toJSTString(initialData?.start_date),
      end_date: toJSTString(initialData?.end_date),
    },
  });

  const watchType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        start_date: values.start_date ? fromJSTToISO(values.start_date) : null,
        end_date: values.end_date ? fromJSTToISO(values.end_date) : null,
      };

      const programId = initialData ? initialData.id : (await supabase.from("programs").insert([payload]).select().single()).data?.id;

      if (!programId) throw new Error("Program ID unavailable");

      // Update basic info if editing
      if (initialData) {
        const { error: updateError } = await supabase.from("programs").update(payload).eq("id", programId);
        if (updateError) throw updateError;
      }

      // Update Question Links (Full Replace Strategy for simplicity)
      // 1. Delete all existing
      await supabase.from("program_questions").delete().eq("program_id", programId);

      // 2. Insert new selections
      const links = Array.from(selectedQuestionIds).map((qid, index) => ({
        program_id: programId,
        question_id: qid,
        question_number: index + 1
      }));

      if (links.length > 0) {
        const { error: linkError } = await supabase.from("program_questions").insert(links);
        if (linkError) throw linkError;
      }

      router.push("/admin/programs");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input placeholder="例: 情報セキュリティ基礎テスト" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>タイプ</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="タイプを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="test">小テスト (Test)</SelectItem>
                    <SelectItem value="exam">試験 (Exam)</SelectItem>
                    <SelectItem value="lecture">講習 (Lecture)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリー</FormLabel>
                <FormControl>
                  <Input placeholder="例: Security, AI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea placeholder="プログラムの説明を入力..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => {
              // 値のパース (YYYY-MM-DDTHH:MM or Empty)
              // 時間が保存されていない場合はデフォルト09:00などにするか、あるいは空にするか
              // ここでは値を分解して管理
              const dateVal = field.value ? field.value.split("T")[0] : "";
              const timeVal = (field.value && field.value.includes("T")) ? field.value.split("T")[1].slice(0, 5) : "00:00";

              const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newDate = e.target.value;
                if (!newDate) {
                  field.onChange(""); // クリア
                  return;
                }
                // 日付変更時、時間は既存のものを使うかデフォルト
                field.onChange(`${newDate}T${timeVal}`);
              };

              const handleTimeChange = (newTime: string) => {
                // 日付が未選択の場合どうするか？今のところ日付選択を強制するUIではないが
                // 日付が入ってないなら日付も入れさせるべきだが、とりあえず日付未入力なら何もしないか、
                // あるいは空のDate+Timeは作れないので無視
                if (!dateVal) return;
                field.onChange(`${dateVal}T${newTime}`);
              };

              return (
                <FormItem>
                  <FormLabel>開始日時</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="date"
                        value={dateVal}
                        onChange={handleDateChange}
                        className=""
                      />
                    </FormControl>
                    <Select value={timeVal} onValueChange={handleTimeChange}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="時間" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => {
              const dateVal = field.value ? field.value.split("T")[0] : "";
              const timeVal = (field.value && field.value.includes("T")) ? field.value.split("T")[1].slice(0, 5) : "00:00";

              const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newDate = e.target.value;
                if (!newDate) {
                  field.onChange("");
                  return;
                }
                field.onChange(`${newDate}T${timeVal}`);
              };

              const handleTimeChange = (newTime: string) => {
                if (!dateVal) return;
                field.onChange(`${dateVal}T${newTime}`);
              };

              return (
                <FormItem>
                  <FormLabel>終了日時</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="date"
                        value={dateVal}
                        onChange={handleDateChange}
                        className=""
                      />
                    </FormControl>
                    <Select value={timeVal} onValueChange={handleTimeChange}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="時間" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {watchType !== 'lecture' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="time_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>制限時間 (分)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>0の場合は無制限</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passing_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>合格点</FormLabel>
                  <FormControl>
                    <Input type="number" max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {watchType === 'lecture' && (
          <FormField
            control={form.control}
            name="content_body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>講習内容 (Markdown / Embed)</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[200px]" placeholder="# 講習内容..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-medium">問題選択</h3>
          <div className="border rounded-md p-4 h-[400px] overflow-y-auto space-y-2">
            {questions.length === 0 && <p className="text-sm text-muted-foreground">登録された問題がありません。</p>}
            {questions.map((q) => (
              <div key={q.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                <Checkbox
                  id={`q-${q.id}`}
                  checked={selectedQuestionIds.has(q.id)}
                  onCheckedChange={() => toggleQuestion(q.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`q-${q.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {q.text}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {q.question_type === 'single_choice' ? '単一選択' : '記述式'} / Lv.{q.difficulty} / {q.points}点
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground text-right">
            選択中: {selectedQuestionIds.size} 問
          </div>
        </div>


        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </form>
    </Form>
  );
}
