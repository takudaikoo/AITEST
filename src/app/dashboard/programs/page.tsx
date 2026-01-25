

import { ProgramFilters } from "@/components/user/programs/ProgramFilters";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { createClient } from "@/lib/supabase/server";
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

interface ProgramListPageProps {
    searchParams: {
        page?: string;
        type?: string;
        category?: string;
        q?: string;
    };
}

export default async function ProgramListPage({ searchParams }: ProgramListPageProps) {
    const supabase = createClient();

    // Parse Params
    const page = Number(searchParams.page) || 1;
    const type = searchParams.type;
    const category = searchParams.category;
    const query = searchParams.q;
    const pageSize = 12;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build Query
    let dbQuery = supabase
        .from("programs")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (type && type !== 'all') {
        dbQuery = dbQuery.eq("type", type);
    }

    if (category && category !== 'all') {
        dbQuery = dbQuery.eq("category", category);
    }

    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Execute with pagination
    const { data: programs, count } = await dbQuery.range(from, to);

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6 flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold tracking-tight">プログラム一覧</h2>
                <Suspense>
                    <ProgramFilters />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {programs?.map((program) => (
                    <Card key={program.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant={program.type === 'lecture' ? 'secondary' : program.type === 'exam' ? 'destructive' : 'default'}>
                                    {program.type === 'test' ? '小テスト' :
                                        program.type === 'exam' ? '認定試験' : '講習'}
                                </Badge>
                                {program.category && <Badge variant="outline" className="text-xs truncate max-w-[150px]" title={program.category}>{program.category}</Badge>}
                                {program.xp_reward && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">
                                        {program.xp_reward} XP
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-base line-clamp-2 leading-tight min-h-[3rem]">{program.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 pt-0 space-y-2 text-xs text-muted-foreground">
                            <p className="line-clamp-3 min-h-[4.5em]">{program.description}</p>
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
                                            {program.end_date ? format(new Date(program.end_date), 'MM/dd') : format(new Date(program.start_date || ''), 'MM/dd')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full" size="sm" asChild>
                                <Link href={`/dashboard/programs/${program.id}`}>詳細を見る</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {programs?.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground">
                    該当するプログラムが見つかりませんでした。
                </div>
            )}

            <div className="mt-auto">
                <Suspense>
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        hasNextPage={page < totalPages}
                        hasPrevPage={page > 1}
                    />
                </Suspense>
            </div>
        </div>
    );
}
