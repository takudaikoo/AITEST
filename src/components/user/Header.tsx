"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LogOut, User as UserIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-dark">
            <div className="container flex h-16 items-center">
                <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
                    <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
                    <span className="hidden font-bold sm:inline-block text-xl tracking-tight text-gradient">
                        AI学ぶくん <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Premium</span>
                    </span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link
                        href="/dashboard"
                        className="transition-colors hover:text-foreground/80 text-foreground"
                    >
                        ダッシュボード
                    </Link>
                    <Link
                        href="/dashboard/programs"
                        className="transition-colors hover:text-foreground/80 text-muted-foreground"
                    >
                        プログラム一覧
                    </Link>
                    <Link
                        href="/dashboard/history"
                        className="transition-colors hover:text-foreground/80 text-muted-foreground"
                    >
                        学習履歴
                    </Link>
                </nav>
                <div className="ml-auto flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/avatars/01.png" alt="@user" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">ユーザー名</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        user@example.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>プロフィール</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>ログアウト</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
