import { ProgramForm } from "@/components/admin/programs/ProgramForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Program } from "@/types/database";
import { ProgramQuestionsManager } from "@/components/admin/programs/ProgramQuestionsManager";

interface EditProgramPageProps {
    params: {
        id: string;
    };
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
    const supabase = createClient();
    const { data: program, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !program) {
        return notFound();
    }

    // Cast relevant fields if necessary. 
    // In our type def, type is strictly typed, but from DB it comes as string.
    // We can assume it matches or force cast.
    const typedProgram = program as Program;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">プログラム編集</h2>
            </div>
            <div className="grid gap-6">
                <div className="rounded-md border bg-card p-6">
                    <h3 className="mb-4 text-lg font-medium">基本情報</h3>
                    <ProgramForm initialData={typedProgram} />
                </div>

                <div className="rounded-md border bg-card p-6">
                    <ProgramQuestionsManager programId={program.id} />
                </div>
            </div>
        </div>
    );
}
