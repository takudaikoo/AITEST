// 回答の振り返り用スナップショット。
// 共有DBの questions/options テーブル（SMART GOLF用スキーマ・AIの問題IDは未登録）に
// 依存せず結果を表示できるよう、受験時点の問題文・選択肢・正誤・ユーザー回答を
// learning_history.program_snapshot_type に JSON 文字列として保存する。

export interface SnapshotOption {
    text: string;
    isCorrect: boolean;
}

export interface SnapshotQuestion {
    n: number;                    // 問題番号(1始まり)
    text: string;                 // 問題文
    type: string;                 // single_choice | multiple_choice | text
    options: SnapshotOption[];    // 選択肢(テキストと正誤)
    userOptionTexts: string[];    // ユーザーが選んだ選択肢テキスト
    userText: string | null;      // 記述回答
    correctOptionTexts: string[]; // 正解の選択肢テキスト
    explanation: string | null;
    isCorrect: boolean;
}

export interface AnswerSnapshot {
    v: 1;
    questions: SnapshotQuestion[];
}

/**
 * 受験画面のメモリ上のデータからスナップショットを生成する。
 * @param questions 問題配列（id, text, question_type, explanation, options[{id,text,is_correct}]）
 * @param answers   question_id -> 選択肢id | 選択肢id配列 | 記述文字列
 * @param isCorrectFor 各問の正誤判定（記述問題はAI採点結果などで判定が分かれるため呼び出し側が指定）
 */
export function buildAnswerSnapshot(
    questions: any[],
    answers: Record<string, any>,
    isCorrectFor: (q: any, answer: any) => boolean
): AnswerSnapshot {
    const snapQuestions: SnapshotQuestion[] = questions.map((q, i) => {
        const a = answers[q.id];
        const opts: any[] = q.options || [];

        let userOptionTexts: string[] = [];
        let userText: string | null = null;

        if (q.question_type === 'text') {
            userText = typeof a === 'string' ? a : null;
        } else if (q.question_type === 'multiple_choice') {
            const selected: any[] = Array.isArray(a) ? a : [];
            userOptionTexts = opts.filter(o => selected.includes(o.id)).map(o => o.text);
        } else {
            userOptionTexts = opts.filter(o => o.id === a).map(o => o.text);
        }

        return {
            n: i + 1,
            text: q.text,
            type: q.question_type,
            options: opts.map(o => ({ text: o.text, isCorrect: !!o.is_correct })),
            userOptionTexts,
            userText,
            correctOptionTexts: opts.filter(o => o.is_correct).map(o => o.text),
            explanation: q.explanation ?? null,
            isCorrect: isCorrectFor(q, a),
        };
    });

    return { v: 1, questions: snapQuestions };
}
