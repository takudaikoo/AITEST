import { createServiceClient } from "@/lib/supabase/service";
import { KakuninTestDashboard } from "@/components/admin/KakuninTestDashboard";

export const dynamic = "force-dynamic";

// 確認テストの対象外ユーザー（メールアドレスで指定）
const EXCLUDED_EMAILS = [
    "smagol.ryosuke.nishikawa@gmail.com", // 西川良輔
    "yuto_takasuka@gjb.co.jp",            // 高須賀優人
    "naoto_takasuka@gjb.co.jp",           // 高須賀直人
    "ryosuke_kikuchi@gjb.co.jp",          // 菊池亮佑
    "juza_ittogi@gjb.co.jp",              // 一藤木 十座
];

export default async function KakuninTestPage() {
    const supabase = createServiceClient();

    // 確認テストのプログラムを取得
    const { data: program } = await supabase
        .from("programs")
        .select("id, title, xp_reward")
        .eq("category", "確認テスト")
        .single();

    // 全ユーザー（部署付き）を取得（対象外ユーザーを除く）
    const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, department_id, departments(name)")
        .not("email", "in", `(${EXCLUDED_EMAILS.map((e) => `"${e}"`).join(",")})`)
        .order("full_name");

    // 部署一覧
    const { data: departments } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

    // 受験履歴（完了のみ）
    let attempts: any[] = [];
    if (program) {
        const { data } = await supabase
            .from("learning_history")
            .select("id, user_id, score, is_passed, started_at")
            .eq("program_id", program.id)
            .eq("status", "completed")
            .order("started_at", { ascending: false });
        attempts = data || [];
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">確認テスト管理</h2>
                <p className="text-muted-foreground">確認テスト 2026年6月 の受講状況と点数を確認します。</p>
            </div>
            <KakuninTestDashboard
                program={program}
                users={users || []}
                departments={departments || []}
                attempts={attempts}
            />
        </div>
    );
}
