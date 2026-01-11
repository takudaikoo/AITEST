import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
    const supabase = createClient();
    const { data: users } = await supabase
        .from("profiles")
        .select(`
        *,
        departments ( name )
    `)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
                <Button variant="outline" asChild>
                    <Link href="/admin/users/departments">
                        <Building2 className="mr-2 h-4 w-4" />
                        部署を管理
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>メールアドレス</TableHead>
                            <TableHead>部署</TableHead>
                            <TableHead>ランク</TableHead>
                            <TableHead>権限</TableHead>
                            <TableHead>XP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    ユーザーがいません。
                                </TableCell>
                            </TableRow>
                        )}
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.departments?.name || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{user.rank}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{user.role}</Badge>
                                </TableCell>
                                <TableCell>{user.xp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
