import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question } from '@/types/database';
import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface OrderedQuestionsListProps {
    questions: Question[];
    onReorder: (newOrder: string[]) => void;
    onRemove: (id: string) => void;
}

function SortableItem({ question, onRemove }: { question: Question; onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-3 mb-2 bg-card hover:bg-accent/50 group"
        >
            <div {...attributes} {...listeners} className="cursor-move text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{question.text}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal">
                        Lv.{question.difficulty}
                    </Badge>
                    <span>{question.category || 'No Category'}</span>
                    <span>•</span>
                    <span>
                        {question.question_type === 'single_choice' ? '単一' :
                            question.question_type === 'multiple_choice' ? '複数' : '記述'}
                    </span>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(question.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
                <X className="h-4 w-4" />
            </Button>
        </Card>
    );
}

export function OrderedQuestionsList({ questions, onReorder, onRemove }: OrderedQuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id);
            const newIndex = questions.findIndex((q) => q.id === over.id);

            const newQuestions = arrayMove(questions, oldIndex, newIndex);
            onReorder(newQuestions.map(q => q.id));
        }
    }

    if (questions.length === 0) {
        return (
            <div className="text-sm text-muted-foreground text-center p-8 border border-dashed rounded-md">
                上部のリストから問題を選択してください
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={questions.map(q => q.id)}
                strategy={verticalListSortingStrategy}
            >
                <div>
                    {questions.map((q) => (
                        <SortableItem key={q.id} question={q} onRemove={onRemove} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
