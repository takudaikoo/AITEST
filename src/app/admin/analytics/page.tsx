import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
    const supabase = createClient();

    // 1. Departments
    const { data: departments } = await supabase.from("departments").select("id, name");

    // 2. Users (Profiles)
    const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, department_id")
        .order("full_name");

    // 3. Attempts (History)
    const { data: attempts } = await supabase
        .from("learning_history")
        .select(`
            id, score, is_passed, status, created_at, user_id,
            profiles!inner ( id, full_name, department_id )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

    // 4. Worst Questions
    const { data: worstQuestions } = await supabase
        .from("weaknesses")
        .select(`
            question_id, failure_count,
            questions ( text, phase )
        `)
        .order("failure_count", { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">パフォーマンス分析</h2>
                <p className="text-muted-foreground">組織全体の学習状況と弱点を分析します。</p>
            </div>

            <AnalyticsDashboard
                departments={departments || []}
                users={users || []}
                attempts={attempts || []}
                worstQuestionsInitial={worstQuestions || []}
            />
        </div>
    );
}
