import { createServiceClient } from "@/lib/supabase/service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    console.log("AnalyticsPage: Starting fetch...");
    // Use Service Client to bypass RLS for Admin Analytics
    const supabase = createServiceClient();

    let departments: any[] = [];
    let users: any[] = [];
    let attempts: any[] = [];
    let worstQuestions: any[] = [];
    let fetchError = null;

    try {
        // 1. Departments
        const { data: deptData, error: deptError } = await supabase.from("departments").select("id, name");
        if (deptError) throw new Error(`Departments: ${deptError.message}`);
        departments = deptData || [];

        // 2. Users (Profiles)
        const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id, full_name, department_id")
            .order("full_name");

        if (userError) throw new Error(`Profiles: ${userError.message}`);
        users = userData || [];
        console.log(`AnalyticsPage: Fetched ${users.length} users`);

        // 3. Attempts (History)
        const { data: attemptData, error: attemptError } = await supabase
            .from("learning_history")
            .select(`
                id, score, is_passed, status, created_at, user_id,
                profiles ( id, full_name, department_id )
            `)
            .eq("status", "completed")
            .order("created_at", { ascending: false });

        if (attemptError) throw new Error(`LearningHistory: ${attemptError.message}`);
        attempts = attemptData || [];
        console.log(`AnalyticsPage: Fetched ${attempts.length} attempts`);

        // 4. Worst Questions
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
            console.warn("Weaknesses fetch failed (non-critical):", e);
        }

    } catch (e: any) {
        console.error("Analytics Page Fetch Error:", e);
        fetchError = e.message;
    }

    if (fetchError) {
        return (
            <div className="p-8">
                <h2 className="text-xl font-bold text-red-600 mb-2">データの取得に失敗しました</h2>
                <p className="text-muted-foreground mb-4">{fetchError}</p>
                <div className="text-sm text-gray-500">
                    ※ データベース接続を確認するか、管理者に問い合わせてください。
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">パフォーマンス分析</h2>
                <p className="text-muted-foreground">組織全体の学習状況と弱点を分析します。</p>
            </div>

            <AnalyticsDashboard
                departments={departments}
                users={users}
                attempts={attempts}
                worstQuestionsInitial={worstQuestions}
            />
        </div>
    );
}
