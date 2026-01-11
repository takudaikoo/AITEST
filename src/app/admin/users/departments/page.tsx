import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { DepartmentForm } from "@/components/admin/users/DepartmentForm";

export default async function DepartmentsPage() {
    const supabase = createClient();
    const { data: departments } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">部署管理</h2>
                <p className="text-muted-foreground">組織の部署を管理します。</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>新しい部署を追加</CardTitle>
                        <CardDescription>部署名を入力して追加してください。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DepartmentForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>部署一覧</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>部署名</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                                            部署が登録されていません。
                                        </TableCell>
                                    </TableRow>
                                )}
                                {departments?.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell>{dept.name}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Delete button would go here (requires client component for interaction or form action) */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
