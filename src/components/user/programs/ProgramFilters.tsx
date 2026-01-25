"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const CATEGORIES = [
    "GeminiとGoogle環境の基礎（環境理解）",
    "日常業務の効率化（メール・ドキュメント・個別対応）",
    "データ活用と可視化（スプレッドシート・スライド）",
    "ノーコード開発・業務アプリ作成（AppSheet等）",
    "個別対応・One on One・パーソナライズ",
    "キャリア形成・リスキリング（AI時代を生き抜く）",
    "クリエイティブ・マーケティング（画像・動画）",
    "倫理・セキュリティ・リスク（Google Workspace編）",
    "業界別・職種別ユースケース（応用）",
    "未来への準備・マインドセット"
];

export function ProgramFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentTab = searchParams.get("type") || "all";
    const currentCategory = searchParams.get("category") || "all";
    const currentSearch = searchParams.get("q") || "";

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        params.set("page", "1"); // Reset page
        router.push(`?${params.toString()}`);
    }, 300);

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val === "all") {
            params.delete("type");
        } else {
            params.set("type", val);
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleCategoryChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val === "all") {
            params.delete("category");
        } else {
            params.set("category", val);
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <Tabs defaultValue={currentTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="all">すべて</TabsTrigger>
                        <TabsTrigger value="lecture">講習</TabsTrigger>
                        <TabsTrigger value="test">テスト</TabsTrigger>
                        <TabsTrigger value="exam">試験</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Select defaultValue={currentCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="カテゴリで絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべてのカテゴリ</SelectItem>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="検索..."
                            className="pl-8"
                            defaultValue={currentSearch}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
