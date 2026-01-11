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
import { Program } from "@/types/database";
import { Loader2 } from "lucide-react";

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

interface ProgramFormProps {
  initialData?: Program;
}

export function ProgramForm({ initialData }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "test",
      category: initialData?.category || "",
      time_limit: initialData?.time_limit || 0,
      passing_score: initialData?.passing_score || 80,
      content_body: initialData?.content_body || "",
      start_date: initialData?.start_date || "",
      end_date: initialData?.end_date || "",
    },
  });

  const watchType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const { error } = initialData
        ? await supabase.from("programs").update(values).eq("id", initialData.id)
        : await supabase.from("programs").insert([values]);

      if (error) {
        throw error;
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>開始日時</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>終了日時</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </form>
    </Form>
  );
}
