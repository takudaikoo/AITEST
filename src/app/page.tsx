import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BrainCircuit, LayoutDashboard } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-background selection:bg-primary/20">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="z-10 w-full max-w-5xl px-5 text-center flex flex-col items-center gap-8">
                {/* Hero Icon */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-background border border-white/10 glass-dark shadow-glow">
                        <BrainCircuit className="w-12 h-12 text-primary" />
                    </div>
                </div>

                {/* Hero Text */}
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        <span className="text-gradient">AI Exam-kun</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        社内AIリテラシーを次世代へ。<br />
                        AI時代に必須の知識とスキルを、洗練されたプラットフォームで学びましょう。
                    </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full justify-center">
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto min-w-[200px] h-12 text-lg rounded-full shadow-glow animate-in fade-in zoom-in duration-500">
                            学習を始める
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>


                </div>

                {/* Stats / Trust (Visual Filler) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/5 w-full max-w-3xl">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl font-bold text-white">12+</span>
                        <span className="text-sm text-muted-foreground">学習プログラム</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl font-bold text-white">500+</span>
                        <span className="text-sm text-muted-foreground">受講者</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 col-span-2 md:col-span-1">
                        <span className="text-3xl font-bold text-white">No.1</span>
                        <span className="text-sm text-muted-foreground">社内評価</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 text-xs text-muted-foreground/50">
                &copy; 2024 AI Exam-kun Inc. All rights reserved.
            </div>
        </main>
    );
}
