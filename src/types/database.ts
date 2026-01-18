export type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: 'user' | 'admin';
    department_id: string | null;
    rank: string;
    xp: number;
};

export type ProgramType = 'test' | 'exam' | 'lecture';

export type Program = {
    id: string;
    title: string;
    description: string | null;
    type: ProgramType;
    category: string | null;
    time_limit: number | null;
    passing_score: number | null;
    is_active: boolean;
    content_body: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string | null;
    created_at: string;
};

export type Question = {
    id: string;
    text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'text';
    explanation: string | null;
    resource_url: string | null;
    phase: number | null;
    difficulty: number | null;
    tags: string[] | null;
    category: string | null;
    image_url: string | null;
    created_at: string;
};
