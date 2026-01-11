import { ProgramForm } from "@/components/admin/programs/ProgramForm";

export default function NewProgramPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">新規プログラム作成</h2>
      </div>
      <div className="rounded-md border bg-card p-6">
        <ProgramForm />
      </div>
    </div>
  );
}
