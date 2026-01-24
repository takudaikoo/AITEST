import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, BookOpen, CheckCircle2, Trophy } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function ProgramListPage() {
    const supabase = createClient();
    const { data: programs } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    const lectures = programs?.filter(p => p.type === 'lecture') || [];
    const tests = programs?.filter(p => p.type === 'test') || [];
    const exams = programs?.filter(p => p.type === 'exam') || [];

    const ProgramCard = ({ program }: { program: any }) => (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                    {program.category && <Badge variant="outline" className="text-xs">{program.category}</Badge>}
                    {/* XP Badge if available */}
                    {program.xp_reward && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">
                            {program.xp_reward} XP
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-base line-clamp-2 leading-tight">{program.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 pt-0 space-y-2 text-xs text-muted-foreground">
                <p className="line-clamp-2 min-h-[2.5em]">{program.description}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                    {program.time_limit && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{program.time_limit}分</span>
                        </div>
                    )}
                    {(program.start_date || program.end_date) && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {program.end_date ? format(new Date(program.end_date), 'MM/dd') : format(new Date(program.start_date), 'MM/dd')}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full text-xs h-8" size="sm" asChild>
                    <Link href={`/dashboard/programs/${program.id}`}>詳細を見る</Link>
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-3xl font-bold tracking-tight">プログラム一覧</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Lectures Column */}
                <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-muted h-full">
                    <div className="flex items-center gap-2 font-semibold text-lg text-emerald-600 shrink-0">
                        <BookOpen className="h-5 w-5" />
                        <h3>学習プログラム</h3>
                        <Badge variant="secondary" className="ml-auto">{lectures.length}</Badge>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-4 pb-4">
                            {lectures.map(p => <ProgramCard key={p.id} program={p} />)}
                            {lectures.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">ありません</div>}
                        </div>
                    </ScrollArea>
                </div>

                {/* Tests Column */}
                <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-muted h-full">
                    <div className="flex items-center gap-2 font-semibold text-lg text-blue-600 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                        <h3>確認テスト</h3>
                        <Badge variant="secondary" className="ml-auto">{tests.length}</Badge>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-4 pb-4">
                            {tests.map(p => <ProgramCard key={p.id} program={p} />)}
                            {tests.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">ありません</div>}
                        </div>
                    </ScrollArea>
                </div>

                {/* Exams Column */}
                <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-muted h-full">
                    <div className="flex items-center gap-2 font-semibold text-lg text-amber-600 shrink-0">
                        <Trophy className="h-5 w-5" />
                        <h3>認定試験</h3>
                        <Badge variant="secondary" className="ml-auto">{exams.length}</Badge>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-4 pb-4">
                            {exams.map(p => <ProgramCard key={p.id} program={p} />)}
                            {exams.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">ありません</div>}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
