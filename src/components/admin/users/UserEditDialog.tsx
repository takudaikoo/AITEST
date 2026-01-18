
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
    full_name: z.string().optional(),
    department_id: z.string().optional(),
    role: z.enum(["user", "admin"]),
});

type Department = {
    id: string;
    name: string;
};

type UserProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: "user" | "admin";
    department_id: string | null;
};

interface UserEditDialogProps {
    user: any; // Using any because of the join type complexity, but locally typed as UserProfileish
    departments: Department[];
}

export function UserEditDialog({ user, departments }: UserEditDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: user.full_name || "",
            department_id: user.department_id || "none",
            role: user.role,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const updates = {
                full_name: values.full_name,
                department_id: values.department_id === "none" ? null : values.department_id,
                role: values.role,
            };

            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id);

            if (error) throw error;

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("更新に失敗しました");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ユーザー情報の編集</DialogTitle>
                    <DialogDescription>
                        {user.email} の情報を変更します。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>氏名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="氏名を入力" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="department_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>部署</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="部署を選択" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">未所属</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>権限</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="権限を選択" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="user">一般ユーザー</SelectItem>
                                            <SelectItem value="admin">管理者</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
