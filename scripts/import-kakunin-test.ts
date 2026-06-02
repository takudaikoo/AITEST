import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PROGRAM_TITLE = '確認テスト 2026年6月';
const CSV_PATH = path.join(process.cwd(), 'imports', 'test', '確認テスト_2026年6月.csv');

async function main() {
    console.log('--- 確認テスト インポート開始 ---');

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV not found: ${CSV_PATH}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8').replace(/^﻿/, '').trim();
    const lineCount = csvContent.split('\n').length - 1; // minus header
    console.log(`問題数（行数）: ${lineCount}`);

    const programPayload = {
        title: PROGRAM_TITLE,
        description: '第1回〜第6回の講習内容を総合した確認テストです。全員必須です。',
        type: 'exam',
        category: '確認テスト',
        quiz_csv: csvContent,
        xp_reward: 500,
        level_requirement: 1,
        is_active: true,
        time_limit: 40,
    };

    const { data: existing } = await supabase
        .from('programs')
        .select('id')
        .eq('title', PROGRAM_TITLE)
        .maybeSingle();

    if (existing) {
        console.log(`既存プログラムを更新: ${PROGRAM_TITLE}`);
        const { error } = await supabase
            .from('programs')
            .update(programPayload)
            .eq('id', existing.id);
        if (error) { console.error('Update error:', error); process.exit(1); }
        console.log('更新完了 ID:', existing.id);
    } else {
        console.log(`新規プログラムを作成: ${PROGRAM_TITLE}`);
        const { data: created, error } = await supabase
            .from('programs')
            .insert(programPayload)
            .select()
            .single();
        if (error || !created) { console.error('Insert error:', error); process.exit(1); }
        console.log('作成完了 ID:', created.id);
    }

    console.log('--- インポート完了 ---');
}

main().catch(console.error);
