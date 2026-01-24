"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { completeActivity } from "@/app/actions/gamification";
import { toast } from "sonner";

interface LectureViewerProps {
    historyId: string;
    programId: string;
    title: string;
    content: string;
    videoUrl?: string; // Optional
}

export function LectureViewer({ historyId, programId, title, content, videoUrl }: LectureViewerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async () => {
        if (isCompleting) return;
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
        <div className="max-w-4xl mx-auto space-y-8">
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

            <div className="flex justify-center">
                <Button size="lg" onClick={handleComplete} disabled={isCompleting} className="gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    学習を完了する
                </Button>
            </div>
        </div>
    );
}
