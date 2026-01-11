"use client";

import { QuestionForm } from "@/components/admin/questions/QuestionForm";
import { useRouter } from "next/navigation";

export default function NewQuestionPage() {
    const router = useRouter();

    return (
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">新規問題作成</h2>
            <div className="rounded-md border bg-card p-6">
                {/* Pass dummy programID or refactor QuestionForm to make it optional. 
                     Refactoring QuestionForm is better but purely for 'New Question' page usage 
                     we can pass a null or handle it. 
                     Wait, existing QuestionForm logic links question to a program immediately. 
                     We need to decoupling that.
                 */}
                <QuestionForm
                    programId=""
                    onSuccess={() => router.push("/admin/questions")}
                    className="standalone-mode" // hint to skip linking
                />
            </div>
        </div>
    );
}
