export const XP_CONFIG = {
    // 講習: 一律
    LECTURE_DEFAULT: 50,

    // テスト: 基本XP + (レベル * 係数) * 難易度倍率
    TEST: {
        BASE: 100,
        LEVEL_MULTIPLIER: 50,
        DIFFICULTY_MULTIPLIER: {
            BEGINNER: 1.0,
            INTERMEDIATE: 1.5,
            ADVANCED: 2.0,
        },
    },

    // 試験: ランク帯ごとの固定報酬
    EXAM: {
        BEGINNER: 1000,
        STANDARD: 3000,
        EXPERT: 10000,
        MASTER: 30000, // 最終試験想定
    },
};

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type RankTier = 'BEGINNER' | 'STANDARD' | 'EXPERT' | 'MASTER';

export function calculateXpReward(type: 'lecture' | 'test' | 'exam', level: number, difficulty?: Difficulty, rankTier?: RankTier): number {
    if (type === 'lecture') {
        return XP_CONFIG.LECTURE_DEFAULT;
    }

    if (type === 'test') {
        // デフォルトは初級扱い
        const diffMultiplier = difficulty ? XP_CONFIG.TEST.DIFFICULTY_MULTIPLIER[difficulty] : 1.0;
        // 計算式: (基本100 + (Lv * 50)) * 倍率
        // 例: Lv1 初級 = (100 + 50) * 1 = 150
        // 例: Lv10 上級 = (100 + 500) * 2 = 1200
        const baseCalc = XP_CONFIG.TEST.BASE + (level * XP_CONFIG.TEST.LEVEL_MULTIPLIER);
        return Math.floor(baseCalc * diffMultiplier);
    }

    if (type === 'exam') {
        // ランク帯に基づく
        if (rankTier) {
            return XP_CONFIG.EXAM[rankTier];
        }
        // フォールバック: レベルから推定 (簡易ロジック)
        if (level <= 2) return XP_CONFIG.EXAM.BEGINNER;
        if (level <= 5) return XP_CONFIG.EXAM.STANDARD;
        if (level <= 7) return XP_CONFIG.EXAM.EXPERT;
        return XP_CONFIG.EXAM.MASTER;
    }

    return 0;
}
