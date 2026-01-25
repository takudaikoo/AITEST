"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export function PaginationControls({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage
}: PaginationControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (pageInfo: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageInfo.toString());
        router.push(`?${params.toString()}`);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">前へ</span>
            </Button>

            <div className="flex items-center gap-1 text-sm font-medium">
                <span>{currentPage}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{totalPages}</span>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">次へ</span>
            </Button>
        </div>
    );
}
