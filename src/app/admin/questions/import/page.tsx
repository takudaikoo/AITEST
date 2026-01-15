"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAndValidateQuestions, CsvQuestionInput } from "@/lib/csv-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ImportQuestionsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<CsvQuestionInput[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [importing, setImporting] = useState(false);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setParsedData([]);
            setErrors([]);
            setPreviewMode(false);
            setSuccessCount(null);
        }
    };

    const handlePreview = async () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                if (!buffer) return;

                // Dynamic import or require if needed, but assuming package exists as per previous code
                const Encoding = require('encoding-japanese');
                const uint8Array = new Uint8Array(buffer);
                const detected = Encoding.detect(uint8Array);
                const unicodeString = Encoding.convert(uint8Array, {
                    to: 'UNICODE',
                    from: detected || 'UTF8',
                    type: 'string'
                });

                const result = await parseAndValidateQuestions(unicodeString);
                setParsedData(result.data);
                setErrors(result.errors);
                setPreviewMode(true);
            } catch (err: any) {
                setErrors([`File Read Error: ${err.message}`]);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (parsedData.length === 0 || errors.length > 0) return;
        setImporting(true);

        try {
            let count = 0;
            // Process sequentially to avoid overwhelming DB or strictly parallel for speed?
            // Parallel is fine for reasonable batches.
            const promises = parsedData.map(async (row) => {
                // 1. Insert Question
                const { data: question, error: qError } = await supabase
                    .from('questions')
                    .insert({
                        text: row.content,
                        question_type: row.question_type,
                        explanation: row.explanation,
                        difficulty: row.difficulty,
                        points: row.points,
                        tags: row.tags && row.tags.length > 0 ? row.tags : null,
                        category: row.category || null,
                        image_url: row.image_url || null,
                        // Defaults
                        phase: 1, // Default phase if not provided (not in CSV spec yet but required by logic likely)
                    })
                    .select('id')
                    .single();

                if (qError) throw qError;
                if (!question) throw new Error("No question returned");

                // 2. Insert Options
                if (row.question_type !== 'text' && row.options.length > 0) {
                    const optionsToInsert = row.options.map((optText, idx) => ({
                        question_id: question.id,
                        text: optText,
                        is_correct: row.correct_indices.includes(idx + 1) // 1-based index from CSV logic
                    }));

                    const { error: oError } = await supabase.from('options').insert(optionsToInsert);
                    if (oError) throw oError;
                }

                // NOT LINKING to any program as per requirement "Program Unassigned"
                count++;
            });

            await Promise.all(promises);
            setSuccessCount(count);
            setFile(null);
            setPreviewMode(false);
            setParsedData([]);

        } catch (err: any) {
            console.error(err);
            setErrors(prev => [...prev, `Import Error: ${err.message}`]);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">問題一括インポート (CSV)</h2>
                <Button variant="outline" onClick={() => router.push("/admin/questions")}>
                    一覧に戻る
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>CSVファイルアップロード</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">CSVファイルを選択</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                        <p className="text-sm text-muted-foreground">
                            ヘッダー必須: content, question_type, option_1...
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        <Button onClick={handlePreview} disabled={!file}>
                            プレビュー
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {successCount !== null && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>インポート完了</AlertTitle>
                    <AlertDescription>
                        {successCount} 件の問題を正常にインポートしました。
                    </AlertDescription>
                </Alert>
            )}

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>エラー ({errors.length}件)</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                            {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {previewMode && parsedData.length > 0 && errors.length === 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">プレビュー ({parsedData.length}件)</h3>
                        <Button onClick={handleImport} disabled={importing}>
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            インポート実行
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>問題文</TableHead>
                                    <TableHead>タイプ</TableHead>
                                    <TableHead>選択肢数</TableHead>
                                    <TableHead>難易度</TableHead>
                                    <TableHead>タグ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.slice(0, 10).map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell className="max-w-md truncate" title={row.content}>
                                            {row.content}
                                        </TableCell>
                                        <TableCell>{row.question_type}</TableCell>
                                        <TableCell>{row.options.length}</TableCell>
                                        <TableCell>{row.difficulty}</TableCell>
                                        <TableCell>{row.tags.join(", ")}</TableCell>
                                    </TableRow>
                                ))}
                                {parsedData.length > 10 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            他 {parsedData.length - 10} 件...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
