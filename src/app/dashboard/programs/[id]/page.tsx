import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, PlayCircle, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ProgramDetailPageProps {
    params: {
        id: string;
    };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
    const supabase = createClient();
    const { data: program } = await supabase
        .from("programs")
        .select("*")
        .eq("id", params.id)
        .single();

    const { count: questionCount } = await supabase
        .from('program_questions')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', params.id);

    if (!program) {
        return notFound();
    }

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge className="text-base py-1">
                        {program.type === 'test' ? '小テスト' :
                            program.type === 'exam' ? '試験' : '講習'}
                    </Badge>
                    {program.category && <Badge variant="outline" className="text-base py-1">{program.category}</Badge>}
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{program.title}</h1>
                <p className="text-xl text-muted-foreground">{program.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {program.time_limit && (
                    <div className="flex items-center gap-4 rounded-lg border p-4 bg-card">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-medium">制限時間</div>
                            <div className="text-2xl font-bold">{program.time_limit}分</div>
                        </div>
                    </div>
                )}
                {(program.passing_score !== null && program.passing_score > 0) && (
                    <div className="flex items-center gap-4 rounded-lg border p-4 bg-card">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-medium">合格点</div>
                            <div className="text-2xl font-bold">{program.passing_score}点</div>
                        </div>
                    </div>
                )}
                {(questionCount !== null && questionCount > 0) && (
                    <div className="flex items-center gap-4 rounded-lg border p-4 bg-card">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-medium">問題数</div>
                            <div className="text-2xl font-bold">{questionCount} 問</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/10 p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                    <PlayCircle className="h-5 w-5" />
                    注意事項
                </h3>
                <ul className="list-disc list-inside space-y-1 text-foreground text-sm font-medium">
                    <li>試験中はブラウザの「戻る」ボタンを使用しないでください。</li>
                    <li>制限時間を過ぎると自動的に終了となります。</li>
                    <li>通信環境の良い場所で受験してください。</li>
                </ul>
            </div>

            <div className="flex justify-center pt-8">
                <Button size="lg" className="w-full max-w-sm text-lg h-14" asChild>
                    <Link href={`/dashboard/programs/${program.id}/play`}>
                        試験を開始する
                    </Link>
                </Button>
            </div>
        </div>
    );
}
