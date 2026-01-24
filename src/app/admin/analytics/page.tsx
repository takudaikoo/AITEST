import { createServiceClient } from "@/lib/supabase/service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    console.log("AnalyticsPage: Starting fetch...");
    // Use Service Client to bypass RLS for Admin Analytics
    const supabase = createServiceClient();

    // 1. Departments
    const { data: departments, error: deptError } = await supabase.from("departments").select("id, name");
    if (deptError) console.error("AnalyticsPage: Dept Error", deptError);

    // 2. Users (Profiles)
    const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, department_id")
        .order("full_name");

    if (userError) console.error("AnalyticsPage: User Error", userError);
    console.log(`AnalyticsPage: Fetched ${users?.length} users`);

    // 3. Attempts (History)
    const { data: attempts, error: attemptError } = await supabase
        .from("learning_history")
        .select(`
            id, score, is_passed, status, created_at, user_id,
            profiles ( id, full_name, department_id )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

    if (attemptError) console.error("AnalyticsPage: Attempt Error", attemptError);
    console.log(`AnalyticsPage: Fetched ${attempts?.length} attempts`);

    // 4. Worst Questions
    let worstQuestions: any[] = [];
    try {
        const { data } = await supabase
            .from("weaknesses")
            .select(`
                question_id, failure_count,
                questions ( text, phase )
            `)
            .order("failure_count", { ascending: false })
            .limit(5);
        if (data) worstQuestions = data;
    } catch (e) {
        // Ignore if table missing
    }

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
