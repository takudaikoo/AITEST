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
import { Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default async function ProgramListPage() {
    const supabase = createClient();
    const { data: programs } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">プログラム一覧</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programs?.map((program) => (
                    <Card key={program.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={program.type === 'lecture' ? 'secondary' : 'default'}>
                                    {program.type === 'test' ? '小テスト' :
                                        program.type === 'exam' ? '試験' : '講習'}
                                </Badge>
                                {program.category && <Badge variant="outline">{program.category}</Badge>}
                            </div>
                            <CardTitle className="line-clamp-1">{program.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{program.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground gap-4">
                                {program.time_limit && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{program.time_limit}分</span>
                                    </div>
                                )}
                            </div>
                            {(program.start_date || program.end_date) && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {program.end_date ? `~ ${format(new Date(program.end_date), 'MM/dd')}` : format(new Date(program.start_date), 'MM/dd')}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild>
                                <Link href={`/dashboard/programs/${program.id}`}>詳細を見る</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {programs?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        現在公開されているプログラムはありません。
                    </div>
                )}
            </div>
        </div>
    );
}
