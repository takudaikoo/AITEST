"use server";

import { createClient } from "@/lib/supabase/server";

import { calculateLevel } from "@/lib/level-utils";

// Removed local RANK_THRESHOLDS in favor of shared level-utils


export interface CompletionResult {
    success: boolean;
    xpGained: number;
    newRank: string | null;
    isRankUp: boolean;
    historyId: string;
    error?: string;
}

export async function completeActivity(
    historyId: string,
    score: number,
    isPassed: boolean,
    completedAt: string = new Date().toISOString() // Should be passed from client or set here? Client might have finish time.
): Promise<CompletionResult> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, xpGained: 0, newRank: null, isRankUp: false, historyId, error: "Unauthorized" };
    }

    try {
        // 1. Fetch History & Program
        const { data: history } = await supabase
            .from("learning_history")
            .select("program_id, status")
            .eq("id", historyId)
            .single();

        if (!history) throw new Error("History not found");

        // Prevent double completion abuse? 
        // If status is already completed, do we award XP again? 
        // Ideally no. But for 'test' re-takes, maybe?
        // Let's strict: XP is awarded only if this specific 'attempt' (history record) transitions to completed.
        // Since we create a NEW history record for each attempt, this is fine. 
        // BUT we should enable updating the SAME record? 
        // ExamRunner creates a new record on start. So updating it is fine.
        // We only check if it was ALREADY completed to avoid double-submit of same session.
        if (history.status === 'completed') {
            return { success: true, xpGained: 0, newRank: null, isRankUp: false, historyId, error: "Already completed" };
        }

        // 2. Fetch Program (for XP Reward)
        const { data: program } = await supabase
            .from("programs")
            .select("xp_reward, type")
            .eq("id", history.program_id)
            .single();

        // Check if user has ALREADY passed/completed this program previously
        // If so, XP reward is 0 (first-time bonus only)
        const { data: existingPass } = await supabase
            .from("learning_history")
            .select("id")
            .eq("user_id", user.id)
            .eq("program_id", history.program_id)
            .eq("is_passed", true)
            .neq("id", historyId) // Don't count current session if somehow persisted
            .limit(1);

        const isFirstTimeCleanPass = !existingPass || existingPass.length === 0;

        // Determine XP Reward
        // If xp_reward is set, use it. Otherwise defaults.
        let xpReward = program?.xp_reward;

        if (xpReward === null || xpReward === undefined) {
            // Fallback defaults if column is null (migration safety)
            if (program?.type === 'lecture') xpReward = 10;
            else if (program?.type === 'test') xpReward = 50;
            else if (program?.type === 'exam') xpReward = 100;
            else xpReward = 10;
        }

        // Zero XP if not passed
        if (!isPassed) {
            xpReward = 0;
        } else if (!isFirstTimeCleanPass) {
            xpReward = 0; // Already passed before
        }

        // 3. Update History
        const { error: histError } = await supabase.from("learning_history").update({
            score: score,
            is_passed: isPassed,
            status: 'completed',
            completed_at: completedAt
        }).eq("id", historyId);

        if (histError) throw histError;

        // 4. Update Profile (XP & Rank)
        let newRank = null;
        let isRankUp = false;

        if (xpReward > 0) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("xp, rank")
                .eq("id", user.id)
                .single();

            if (profile) {
                const currentXp = profile.xp || 0;
                const newXp = currentXp + xpReward;

                // Calculate Rank using shared logic
                const { rank: calculatedRank } = calculateLevel(newXp);

                if (calculatedRank !== profile.rank) {
                    newRank = calculatedRank;
                    isRankUp = true;
                }

                await supabase.from("profiles").update({
                    xp: newXp,
                    rank: calculatedRank
                }).eq("id", user.id);
            }
        }

        return {
            success: true,
            xpGained: xpReward,
            newRank,
            isRankUp,
            historyId
        };

    } catch (e: any) {
        console.error("completeActivity Error:", e);
        return { success: false, xpGained: 0, newRank: null, isRankUp: false, historyId, error: e.message };
    }
}
