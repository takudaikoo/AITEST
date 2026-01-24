import { ProgramForm } from "@/components/admin/programs/ProgramForm";

export default function NewLecturePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">新規講習作成</h2>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <ProgramForm defaultType="lecture" />
            </div>
        </div>
    );
}
