"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileUp } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { ProgramType } from "@/types/database";
import { parseAsJST } from "@/lib/date-utils";

export function ProgramImportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const text = await file.text();

            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const rows = results.data as any[];
                    if (rows.length === 0) {
                        toast.error("CSVにデータが含まれていません");
                        setLoading(false);
                        return;
                    }

                    // Process each row
                    let successCount = 0;
                    let errorCount = 0;

                    for (const row of rows) {
                        try {
                            if (!row.title) throw new Error("タイトルは必須です");

                            // Validate/Map Type
                            let type: ProgramType = 'test';
                            const t = row.type?.toLowerCase().trim();
                            if (t === 'exam' || t === '試験') type = 'exam';
                            else if (t === 'lecture' || t === '講習') type = 'lecture';

                            // Dates
                            const startDate = row.start_date ? parseAsJST(row.start_date).toISOString() : null;
                            const endDate = row.end_date ? parseAsJST(row.end_date).toISOString() : null;

                            // Insert Program
                            const { data: program, error: progError } = await supabase.from('programs').insert({
                                title: row.title,
                                description: row.description,
                                type: type,
                                category: row.category,
                                time_limit: row.time_limit ? parseInt(row.time_limit) : null,
                                passing_score: row.passing_score ? parseInt(row.passing_score) : null,
                                start_date: startDate,
                                end_date: endDate,
                                is_active: false // Default to draft
                            }).select().single();

                            if (progError) throw progError;
                            if (!program) throw new Error("プログラムの作成に失敗しました");

                            // Link Questions
                            if (row.question_ids) {
                                const ids = row.question_ids.split(';').map((id: string) => id.trim()).filter((id: string) => id);
                                if (ids.length > 0) {
                                    const links = ids.map((qid: string, index: number) => ({
                                        program_id: program.id,
                                        question_id: qid,
                                        question_number: index + 1
                                    }));

                                    const { error: linkError } = await supabase.from('program_questions').insert(links);
                                    if (linkError) {
                                        console.error(`Error linking questions for ${row.title}:`, linkError);
                                        // Non-fatal, program is created but questions might fail
                                        toast.warning(`"${row.title}" の問題紐付けに失敗しました (ID不正の可能性)`);
                                    }
                                }
                            }

                            successCount++;

                        } catch (err) {
                            console.error(err);
                            errorCount++;
                        }
                    }

                    toast.success(`インポート完了: 成功 ${successCount}件 / 失敗 ${errorCount}件`);
                    setOpen(false);
                    // Force refresh (optional, but typical in server component parent)
                    window.location.reload();
                },
                error: (error) => {
                    console.error(error);
                    toast.error("CSVの解析に失敗しました");
                    setLoading(false);
                }
            });

        } catch (error) {
            console.error(error);
            toast.error("ファイルの読み込みエラー");
            setLoading(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    CSVインポート
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>プログラムの一括登録</DialogTitle>
                    <DialogDescription>
                        CSVファイルをアップロードしてプログラムを一括登録します。<br />
                        <span className="text-xs text-muted-foreground mt-2 block">
                            ヘッダー: title, type, description, category, time_limit, passing_score, start_date, end_date, question_ids<br />
                            ※ question_ids はセミコロン区切り (例: id1;id2;id3)
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="csv">CSVファイル</Label>
                    <Input
                        ref={fileInputRef}
                        id="csv"
                        type="file"
                        accept=".csv"
                        disabled={loading}
                        onChange={handleFileChange}
                    />
                </div>
                {loading && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">インポート中...</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
