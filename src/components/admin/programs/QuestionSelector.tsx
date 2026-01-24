import { useState, useMemo } from "react";
import { Question } from "@/types/database";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Ensure we have badge, if not use span with class
import { Search } from "lucide-react";

// Fallback Badge if not present, but from file list it seems valid.
// If actual Badge export is missing, we might need a quick fix or just use tailwind class.
// Assuming "badge.tsx" exists in ui folder from file list.

interface QuestionSelectorProps {
    questions: Question[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
}

export function QuestionSelector({ questions, selectedIds, onToggle }: QuestionSelectorProps) {
    const [searchText, setSearchText] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(questions.map(q => q.category).filter(Boolean));
        return Array.from(cats) as string[];
    }, [questions]);

    // Filtering Logic
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            // Text Search
            if (searchText) {
                const lowerText = searchText.toLowerCase();
                const matches = q.text.toLowerCase().includes(lowerText);
                if (!matches) return false;
            }

            // Category Filter
            if (filterCategory !== "all") {
                if (q.category !== filterCategory) return false;
            }

            // Difficulty Filter
            if (filterDifficulty !== "all") {
                if (q.difficulty !== parseInt(filterDifficulty)) return false;
            }

            return true;
        });
    }, [questions, searchText, filterCategory, filterDifficulty]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="問題文を検索..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="カテゴリー" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て (カテゴリー)</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="難易度" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て (難易度)</SelectItem>
                        {[1, 2, 3, 4, 5].map(d => (
                            <SelectItem key={d} value={d.toString()}>Lv.{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-md max-h-[500px] overflow-y-auto relative">
                <Table>
                    <TableHeader className="sticky top-0 bg-secondary/90 backdrop-blur z-10">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>問題文</TableHead>
                            <TableHead className="w-[120px]">カテゴリー</TableHead>
                            <TableHead className="w-[100px]">難易度</TableHead>
                            <TableHead className="w-[80px]">形式</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuestions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    条件に一致する問題がありません
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredQuestions.map((q) => (
                            <TableRow
                                key={q.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onToggle(q.id)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.has(q.id)}
                                        onCheckedChange={() => onToggle(q.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="line-clamp-2" title={q.text}>
                                        {q.text}
                                    </div>
                                    {q.tags && q.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {q.tags.map(t => (
                                                <Badge key={t} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{q.category || "-"}</TableCell>
                                <TableCell>Lv.{q.difficulty}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {q.question_type === 'single_choice' ? '単一' :
                                        q.question_type === 'multiple_choice' ? '複数' : '記述'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="text-right text-sm text-muted-foreground">
                表示中: {filteredQuestions.length} / 全: {questions.length} (選択中: {selectedIds.size})
            </div>
        </div>
    );
}
