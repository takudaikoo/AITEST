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
import { Loader2, Plus, Trash2, ImageIcon, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useRef } from "react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "タイトルは2文字以上で入力してください。",
  }),
  description: z.string().optional(),
  type: z.enum(["test", "exam", "lecture"]),
  category: z.string().optional(),
  time_limit: z.coerce.number().min(0).optional(),
  passing_score: z.coerce.number().min(0).max(100).optional(),
  xp_reward: z.coerce.number().min(0).optional(),
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

import { formatJST, parseAsJST } from "@/lib/date-utils";
import { QuestionSelector } from "./QuestionSelector";
import { parseAndValidateQuestions } from "@/lib/csv-import";
import { OrderedQuestionsList } from "./OrderedQuestionsList";

// Helper: UTC string from DB -> JST string for Form (YYYY-MM-DDTHH:MM)
const toJSTString = (isoString?: string | null) => {
  if (!isoString) return "";
  // formatJST handles the conversion from UTC Date (or string) to JST formatted string
  return formatJST(isoString, "yyyy-MM-dd'T'HH:mm");
};

// Helper: JST string from Form -> ISO string for DB (UTC)
const fromJSTToISO = (jstString?: string | null) => {
  if (!jstString) return null;
  // Parse the JST string (e.g. "2024-01-01T09:00") as JST, then get ISO (UTC)
  const date = parseAsJST(jstString);
  return date.toISOString();
};

export function ProgramForm({ initialData }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]); // Use appropriate Type
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [orderedQuestionIds, setOrderedQuestionIds] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchQuestions = async () => {
      // Fetch all questions
      const { data: allQuestions } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (allQuestions) setQuestions(allQuestions);

      // If editing, fetch existing links
      if (initialData?.id) {
        const { data: links } = await supabase
          .from("program_questions")
          .select("question_id, question_number")
          .eq("program_id", initialData.id)
          .order("question_number", { ascending: true }); // Important: order by number
        if (links) {
          const ids = links.map(l => l.question_id);
          setSelectedQuestionIds(new Set(ids));
          setOrderedQuestionIds(ids);
        }
      }
    };
    fetchQuestions();
  }, [initialData, supabase]);

  const toggleQuestion = (questionId: string) => {
    const newSet = new Set(selectedQuestionIds);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
      // Remove from ordered list
      setOrderedQuestionIds(prev => prev.filter(id => id !== questionId));
    } else {
      newSet.add(questionId);
      // Add to end of ordered list
      setOrderedQuestionIds(prev => [...prev, questionId]);
    }
    setSelectedQuestionIds(newSet);
  };

  const handleReorder = (newOrder: string[]) => {
    setOrderedQuestionIds(newOrder);
  };

  const handleRemove = (id: string) => {
    toggleQuestion(id); // Re-use toggle logic
  };

  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractQuestions = async () => {
    const currentContent = form.getValues("content_body");
    if (!currentContent) return;

    // Regex to find ```csv ... ``` block
    // Matches carefully to avoid greedy capture
    const csvBlockRegex = /```csv\n([\s\S]*?)\n```/;
    const match = currentContent.match(csvBlockRegex);

    if (!match) {
      alert("CSV形式の問題データが見つかりませんでした。\n```csv\n...内容...\n```\nの形式で記述してください。");
      return;
    }

    const csvContent = match[1];

    if (!confirm("テキストから問題を抽出し、データベースに登録しますか？\n(抽出されたCSVブロックは本文から削除されます)")) {
      return;
    }

    setIsExtracting(true);
    try {
      // 1. Parse CSV
      const result = await parseAndValidateQuestions(csvContent);
      if (result.errors.length > 0) {
        alert("CSV解析エラー:\n" + result.errors.join("\n"));
        return;
      }

      if (result.data.length === 0) {
        alert("有効な問題が見つかりませんでした。");
        return;
      }

      // 2. Insert to DB
      // We need users ID for 'created_by' if adhering to RLS, but currently simplified
      const { data: insertedQuestions, error: insertError } = await supabase
        .from('questions')
        .insert(result.data.map(q => ({
          text: q.content,
          question_type: q.question_type,
          options: q.options,
          correct_indices: q.correct_indices,
          explanation: q.explanation,
          difficulty: q.difficulty,
          points: q.points,
          tags: q.tags,
          category: q.category,
          image_url: q.image_url
        })))
        .select();

      if (insertError) throw insertError;

      // 3. Update State (Select these new questions)
      if (insertedQuestions) {
        const newIds = insertedQuestions.map(q => q.id);
        setOrderedQuestionIds(prev => [...prev, ...newIds]);
        setSelectedQuestionIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.add(id));
          return next;
        });
        // Update the local questions list to include new ones immediately
        setQuestions(prev => [...insertedQuestions, ...prev]);
      }

      // 4. Clean up Markdown
      const cleanedContent = currentContent.replace(match[0], "").trim();
      form.setValue("content_body", cleanedContent);

      alert(`${insertedQuestions?.length}問の問題を抽出・登録しました！`);

    } catch (e: any) {
      console.error(e);
      alert("エラーが発生しました: " + e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Prepare ordered question objects for the list
  const selectedQuestions = orderedQuestionIds
    .map(id => questions.find(q => q.id === id))
    .filter(q => q !== undefined) as Question[];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("5MB以下の画像を選択してください");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `program-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lecture-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lecture-assets')
        .getPublicUrl(filePath);

      // Insert markdown at cursor or append
      const markdown = `\n![${file.name}](${publicUrl})\n`;
      const currentContent = form.getValues("content_body") || "";

      // Simple append for now as getting cursor pos in RHF can be tricky without ref access to exact input
      // But we can try to append
      form.setValue("content_body", currentContent + markdown);

    } catch (error: any) {
      console.error(error);
      alert("アップロードに失敗しました: " + error.message);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      xp_reward: initialData?.xp_reward || 0,
      content_body: initialData?.content_body || "",
      start_date: toJSTString(initialData?.start_date),
      end_date: toJSTString(initialData?.end_date),
    },
  });

  const watchType = form.watch("type");

  // Auto-set default XP based on Type if adding new
  useEffect(() => {
    if (!initialData) {
      if (watchType === 'lecture') form.setValue('xp_reward', 10);
      else if (watchType === 'test') form.setValue('xp_reward', 50);
      else if (watchType === 'exam') form.setValue('xp_reward', 100);
    }
  }, [watchType, initialData, form]);

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
      // Use orderedQuestionIds to determine the order
      const links = orderedQuestionIds.map((qid, index) => ({
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

            <FormField
              control={form.control}
              name="xp_reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>獲得XP</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>合格時に付与される経験値</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {watchType === 'lecture' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="xp_reward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>獲得XP (受講完了時)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="content_body"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>講習内容 (Markdown)</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading || isExtracting}
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      画像を追加
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isExtracting}
                      onClick={handleExtractQuestions}
                      className="gap-2 ml-2"
                    >
                      {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      テキストから問題を抽出
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <FormControl>
                    <Textarea className="min-h-[400px] font-mono text-sm leading-relaxed" placeholder="# 大見出し&#13;&#10;## 中見出し&#13;&#10;- リスト1&#13;&#10;- リスト2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-medium">問題選択</h3>
          <QuestionSelector
            questions={questions}
            selectedIds={selectedQuestionIds}
            onToggle={toggleQuestion}
          />

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">選択された問題の並び替え ({orderedQuestionIds.length}問)</h4>
            <OrderedQuestionsList
              questions={selectedQuestions}
              onReorder={handleReorder}
              onRemove={handleRemove}
            />
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
