
import { createClient } from "@/lib/supabase/server";
import { DepartmentForm } from "@/components/admin/users/DepartmentForm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminSettingsPage() {
    const supabase = createClient();

    // Fetch Departments
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: true });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">設定</h1>
                <p className="text-muted-foreground">システムの各種設定を行います。</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>部署マスタ管理</CardTitle>
                        <CardDescription>
                            ユーザーが所属する部署を管理します。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">新規部署の追加</h3>
                            <DepartmentForm />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">登録済み部署一覧</h3>
                            <div className="flex flex-wrap gap-2">
                                {departments?.map((dept) => (
                                    <Badge key={dept.id} variant="secondary" className="text-sm py-1 px-3">
                                        {dept.name}
                                    </Badge>
                                ))}
                                {(!departments || departments.length === 0) && (
                                    <p className="text-sm text-muted-foreground">部署が登録されていません。</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
