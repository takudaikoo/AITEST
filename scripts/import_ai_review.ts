
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { calculateXpReward } from '../src/lib/xp-config';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);
const TESTS_DIR = path.join(process.cwd(), 'imports', 'test');

const TARGETS = [
    { file: '第1回_Gemini基礎_文章作成.csv', title: '第1回_Gemini基礎_文章作成', level_req: 1 },
    { file: '第2回_Gemini基礎_要約.csv', title: '第2回_Gemini基礎_要約', level_req: 1 },
    { file: '第3回_Gemini活用_Gems作成.csv', title: '第3回_Gemini活用_Gems作成', level_req: 1 },
    { file: '第4回_Gemini活用による思考支援＆壁打ち.csv', title: '第4回_Gemini活用による思考支援＆壁打ち', level_req: 1 },
    { file: '第5回_画像生成実践＆リスク管理.csv', title: '第5回_画像生成実践＆リスク管理', level_req: 1 },
    { file: '第6回_情報収集・整理 リサーチ.csv', title: '第6回_情報収集・整理 リサーチ', level_req: 1 },
];

async function main() {
    console.log('Starting AI Review Quiz Import...');

    console.log('Deleting old AI研修振り返り tests...');
    const { error: delError } = await supabase.from('programs')
        .delete()
        .eq('category', 'AI研修振り返り')
        .eq('type', 'test');
    
    if (delError) console.error('Error deleting old tests:', delError);

    for (const target of TARGETS) {
        await processFile(target);
    }

    console.log('All imports completed.');
}

async function processFile(target: { file: string, title: string, level_req: number }) {
    console.log(`Processing ${target.file}...`);
    const filePath = path.join(TESTS_DIR, target.file);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '').trim();

    // Fixed Metadata
    const type = 'test';
    const category = 'AI研修振り返り';
    const difficulty = 'BEGINNER';
    const level = target.level_req;

    // XP Calculation
    const xp_reward = calculateXpReward(type, level, difficulty, undefined);

    // DB Upsert
    const { data: existing } = await supabase
        .from('programs')
        .select('id')
        .eq('title', target.title)
        .eq('type', type)
        .maybeSingle();

    const payload = {
        title: target.title,
        type,
        category,
        xp_reward,
        level_requirement: level,
        quiz_csv: content,
        is_active: true,
        // Ensure description or other required fields are present if needed, 
        // but typically 'description' is optional or can be inferred. 
        // 'description' is often used for lectures but maybe not strictly required for tests if not in UI.
        // Let's add a generic description just in case.
        description: `${target.title} の確認テストです。`,
    };

    if (existing) {
        console.log(`Updating: ${target.title}`);
        const { error } = await supabase.from('programs').update(payload).eq('id', existing.id);
        if (error) console.error('Update Error:', error);
        else console.log('Update Success');
    } else {
        console.log(`Creating: ${target.title}`);
        const { error } = await supabase.from('programs').insert(payload);
        if (error) console.error('Insert Error:', error);
        else console.log('Insert Success');
    }
}

main();
