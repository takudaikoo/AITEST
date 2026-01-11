import { createClient } from "@/lib/supabase/server";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { ja } from "date-fns/locale";

export default async function SchedulePage() {
    const supabase = createClient();
    const today = new Date();

    // Fetch active programs with dates
    const { data: programs } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .or(`start_date.neq.null,end_date.neq.null`);

    // Simple Month View for Current Month
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDayEvents = (date: Date) => {
        return programs?.filter(p => {
            if (!p.end_date) return false;
            // Show indicator on the deadline day
            return isSameDay(parseISO(p.end_date), date);
        }) || [];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">学習スケジュール</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>カレンダー ({format(today, 'yyyy年M月', { locale: ja })})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                            {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                                <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {/* Padding for first day */}
                            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-10"></div>
                            ))}

                            {days.map((day) => {
                                const events = getDayEvents(day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`
                                    h-14 border rounded-md flex flex-col items-center justify-start py-1 text-sm relative
                                    ${isToday(day) ? 'bg-accent/50 border-primary' : 'bg-card'}
                                    ${events.length > 0 ? 'bg-orange-50/50' : ''}
                                `}
                                    >
                                        <span className={isToday(day) ? 'font-bold' : ''}>{format(day, 'd')}</span>
                                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                                            {events.map((e, i) => (
                                                <div key={e.id} className="h-1.5 w-1.5 rounded-full bg-orange-500" title={`締切: ${e.title}`} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>今後の予定・締切</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {programs?.length === 0 && (
                                <p className="text-muted-foreground text-sm">予定されているプログラムはありません。</p>
                            )}
                            {programs?.filter(p => p.end_date && new Date(p.end_date) >= today).sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime()).map(program => (
                                <Link key={program.id} href={`/dashboard/programs/${program.id}`} className="block">
                                    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center rounded-md border bg-background p-2 w-16 h-16 shrink-0">
                                            <span className="text-xs text-muted-foreground">{format(parseISO(program.end_date!), 'M月')}</span>
                                            <span className="text-xl font-bold">{format(parseISO(program.end_date!), 'd')}</span>
                                            <span className="text-xs text-muted-foreground">({format(parseISO(program.end_date!), 'EEE', { locale: ja })})</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">{program.type.toUpperCase()}</Badge>
                                                <span className="text-sm text-destructive font-medium">締切</span>
                                            </div>
                                            <p className="font-medium line-clamp-1">{program.title}</p>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <CalendarIcon className="mr-1 h-3 w-3" />
                                                {format(parseISO(program.end_date!), 'HH:mm')} まで
                                            </div>
                                        </div>
                                        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
