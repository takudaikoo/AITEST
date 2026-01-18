
import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserEditDialog } from "@/components/admin/users/UserEditDialog";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
    const supabase = createClient();

    // Fetch users with their departments
    const { data: users, error } = await supabase
        .from("profiles")
        .select(`
            id,
            email,
            full_name,
            role,
            rank,
            department_id,
            departments (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false });

    const { data: departments } = await supabase
        .from("departments")
        .select("*")
        .order("name");

    console.log(users);

    if (error) {
        return <div>Error loading users: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
                    <p className="text-muted-foreground">
                        ユーザーの権限や所属部署を管理します。
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名前</TableHead>
                            <TableHead>メールアドレス</TableHead>
                            <TableHead>部署</TableHead>
                            <TableHead>権限</TableHead>
                            <TableHead>ランク</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.full_name || "未設定"}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{(user.departments as any)?.name || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                        {user.role === 'admin' ? '管理者' : '一般'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.rank}</TableCell>
                                <TableCell className="text-right">
                                    <UserEditDialog
                                        user={user}
                                        departments={departments || []}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
