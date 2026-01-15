"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

export function QuestionImporter() {
    return (
        <Button asChild variant="outline">
            <Link href="/admin/questions/import">
                <Upload className="mr-2 h-4 w-4" />
                一括インポート
            </Link>
        </Button>
    );
}
