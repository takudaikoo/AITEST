"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

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
            await supabase.from("learning_history").update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                is_passed: true, // Lectures are always passed if completed
                score: 100 // Full score for attendance
            }).eq("id", historyId);

            // Award XP (smaller amount for lecture?)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
                if (profile) {
                    await supabase.from('profiles').update({
                        xp: (profile.xp || 0) + 50 // 50XP for lecture
                    }).eq('id', user.id);
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

                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                        {content || "コンテンツがありません。"}
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
