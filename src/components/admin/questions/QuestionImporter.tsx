"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Download, Upload, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Template CSV Header
const CSV_HEADER = [
    "text",
    "question_type", // single_choice, multiple_choice, text
    "explanation",
    "phase", // 1-7
    "difficulty", // 1-5
    "points",
    "review_program_id",
    "option1", "option1_is_correct", // TRUE/FALSE
    "option2", "option2_is_correct",
    "option3", "option3_is_correct",
    "option4", "option4_is_correct"
];

const EXAMPLE_ROW = [
    "AIの定義として最も適切なものは？", "single_choice", "AIは...", "1", "1", "10", "", "人工知能", "TRUE", "自然知能", "FALSE", "", "", "", ""
];

export function QuestionImporter() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse({
            fields: CSV_HEADER,
            data: [EXAMPLE_ROW]
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "question_import_template.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setErrorMsg(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as any[];
                    if (rows.length === 0) throw new Error("CSVファイルが空です");

                    // Validate headers
                    const headers = results.meta.fields;
                    const missing = CSV_HEADER.filter(h => !headers?.includes(h) && !h.startsWith("option")); // Allow loose option check logic if needed, but strict for core
                    if (!headers?.includes("text") || !headers?.includes("question_type")) {
                        throw new Error(`必須カラムが不足しています: text, question_type は必須です。`);
                    }

                    // Process rows
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const lineNum = i + 2; // header + 1-index

                        if (!row.text) continue; // skip empty text rows logic if parse fail

                        // Insert Question
                        const { data: q, error: qError } = await supabase.from("questions").insert({
                            text: row.text,
                            question_type: row.question_type || "single_choice",
                            explanation: row.explanation || "",
                            phase: row.phase ? parseInt(row.phase) : 1,
                            difficulty: row.difficulty ? parseInt(row.difficulty) : 1,
                            points: row.points ? parseInt(row.points) : 10,
                            review_program_id: row.review_program_id || null
                        }).select().single();

                        if (qError) throw new Error(`${lineNum}行目の問題作成に失敗: ${qError.message}`);

                        // Process Options (1-4 fixed for template simplicity)
                        const optionsToInsert = [];
                        for (let j = 1; j <= 4; j++) {
                            const optText = row[`option${j}`];
                            const optCorrect = row[`option${j}_is_correct`];
                            if (optText) {
                                optionsToInsert.push({
                                    question_id: q.id,
                                    text: optText,
                                    is_correct: optCorrect?.toUpperCase() === "TRUE"
                                });
                            }
                        }

                        if (optionsToInsert.length > 0) {
                            const { error: oError } = await supabase.from("options").insert(optionsToInsert);
                            if (oError) throw new Error(`${lineNum}行目の選択肢保存に失敗: ${oError.message}`);
                        }
                    }

                    alert(`${rows.length}件の問題をインポートしました！`);
                    window.location.reload();

                } catch (err: any) {
                    setErrorMsg(err.message);
                    console.error(err);
                } finally {
                    setLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            },
            error: (err) => {
                setLoading(false);
                setErrorMsg(`CSV解析エラー: ${err.message}`);
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />

            <Button variant="outline" onClick={handleDownloadTemplate} disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                雛形CSV
            </Button>

            <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                CSVインポート
            </Button>

            {errorMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background max-w-md w-full p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold text-destructive mb-2">インポートエラー</h3>
                        <p className="text-sm mb-4">{errorMsg}</p>
                        <Button onClick={() => setErrorMsg(null)}>閉じる</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
