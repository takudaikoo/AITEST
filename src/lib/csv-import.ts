import Papa from 'papaparse';
import { Question } from '../types/database';

export interface CsvQuestionInput {
    content: string;
    question_type: 'single_choice' | 'multiple_choice' | 'text';
    options: string[]; // Aggregated from option_1, option_2, etc.
    correct_indices: number[]; // Aggregated from correct_indices string "1|3"
    explanation?: string;
    difficulty: number;
    points: number;
    tags: string[];
    image_url?: string;
    category?: string;
}

export interface ParseResult {
    data: CsvQuestionInput[];
    errors: string[];
}

export const parseAndValidateQuestions = (fileContent: string): Promise<ParseResult> => {
    return new Promise((resolve) => {
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedQuestions: CsvQuestionInput[] = [];
                const errors: string[] = [];

                results.data.forEach((row: any, index) => {
                    const rowNum = index + 2; // +1 for 0-index, +1 for header

                    // 1. Basic Validation
                    if (!row.content) {
                        errors.push(`Row ${rowNum}: 'content' is required.`);
                        return;
                    }
                    if (!row.question_type) {
                        errors.push(`Row ${rowNum}: 'question_type' is required.`);
                        return;
                    }

                    const type = row.question_type.trim().toLowerCase();
                    if (!['single', 'single_choice', 'multi', 'multiple_choice', 'text'].includes(type)) {
                        errors.push(`Row ${rowNum}: Invalid question_type '${row.question_type}'. Use 'single', 'multi', or 'text'.`);
                        return;
                    }

                    // Map shorter csv types to db types
                    let dbType: 'single_choice' | 'multiple_choice' | 'text' = 'text';
                    if (type.includes('single')) dbType = 'single_choice';
                    else if (type.includes('multi')) dbType = 'multiple_choice';

                    // 2. Options Extraction (Option 1 to Option 10 support)
                    const options: string[] = [];
                    for (let i = 1; i <= 10; i++) {
                        const key = `option_${i}`;
                        // Check case-insensitive match for header if needed, but PapaParse header is case-sensitive by default.
                        // We assume strict header naming as per plan.
                        if (row[key] && row[key].trim() !== '') {
                            options.push(row[key].trim());
                        }
                    }

                    if ((dbType === 'single_choice' || dbType === 'multiple_choice') && options.length < 2) {
                        errors.push(`Row ${rowNum}: 'multiple_choice/single_choice' requires at least 2 options.`);
                        return;
                    }

                    // 3. Correct Answer parsing
                    const correctIndices: number[] = [];
                    if (dbType !== 'text') {
                        if (!row.correct_indices) {
                            errors.push(`Row ${rowNum}: 'correct_indices' is required for choice questions.`);
                            return;
                        }
                        const indicesRaw = row.correct_indices.toString().split(/[|,]/); // Allow | or ,
                        indicesRaw.forEach((val: string) => {
                            const idx = parseInt(val.trim());
                            if (isNaN(idx) || idx < 1 || idx > options.length) {
                                errors.push(`Row ${rowNum}: Invalid correct_index '${val}'. Must be between 1 and ${options.length}.`);
                            } else {
                                correctIndices.push(idx);
                            }
                        });

                        // Sanity check
                        if (correctIndices.length === 0) {
                            errors.push(`Row ${rowNum}: No valid correct_indices found.`);
                            return;
                        }
                    }

                    // 4. Other fields
                    const difficulty = row.difficulty ? parseInt(row.difficulty) : 1;
                    const points = row.points ? parseInt(row.points) : 10;
                    const tags = row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : [];

                    parsedQuestions.push({
                        content: row.content,
                        question_type: dbType,
                        options,
                        correct_indices: correctIndices,
                        explanation: row.explanation || undefined,
                        difficulty: isNaN(difficulty) ? 1 : difficulty,
                        points: isNaN(points) ? 10 : points,
                        tags,
                        image_url: row.image_url || undefined,
                        category: row.category || undefined
                    });
                });

                resolve({ data: parsedQuestions, errors });
            },
            error: (err: any) => {
                resolve({ data: [], errors: [`CSV Parse Error: ${err.message}`] });
            }
        });
    });
};
