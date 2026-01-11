"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileQuestion,
    Users,
    BarChart3,
    Settings,
    LogOut,
    BrainCircuit,
} from "lucide-react";

const navItems = [
    { href: "/admin/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/admin/programs", label: "プログラム管理", icon: FileQuestion },
    { href: "/admin/users", label: "ユーザー管理", icon: Users },
    { href: "/admin/analytics", label: "成績分析", icon: BarChart3 },
    { href: "/admin/settings", label: "設定", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span>AI学ぶくん</span>
                </Link>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="grid gap-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="border-t p-4">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    <LogOut className="h-4 w-4" />
                    ログアウト
                </button>
            </div>
        </div>
    );
}
