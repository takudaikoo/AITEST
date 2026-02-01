
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { calculateXpReward } from '../src/lib/xp-config';
import { parseAndValidateQuestions } from '../src/lib/csv-import';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);
const TESTS_DIR = path.join(process.cwd(), 'imports', 'test');
const TARGET_FILE = '01_環境・基礎(初級).csv';

async function main() {
    console.log(`Debug importing: ${TARGET_FILE}`);
    const filePath = path.join(TESTS_DIR, TARGET_FILE);

    if (!fs.existsSync(filePath)) {
        console.error('File not found!');
        return;
    }

    await processCsvFile(filePath, TARGET_FILE);
}

async function processCsvFile(filePath: string, fileName: string) {
    const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '').trim();

    // Default Variables
    let title = fileName.replace('.csv', '');
    let type: 'lecture' | 'test' | 'exam' = 'test';
    let level = 1;
    let difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER';
    let rankTier: 'BEGINNER' | 'STANDARD' | 'EXPERT' | 'MASTER' | undefined = undefined;

    let num: number | undefined = undefined;
    let jpLevel = '';

    // Parsing Logic
    try {
        const normalizedFile = fileName.normalize('NFC');
        const firstUnderscore = normalizedFile.indexOf('_');
        const openParen = normalizedFile.lastIndexOf('(');
        const closeParen = normalizedFile.lastIndexOf(')');

        if (firstUnderscore > -1 && openParen > firstUnderscore && closeParen > openParen) {
            const numStr = normalizedFile.substring(0, firstUnderscore);
            const namePart = normalizedFile.substring(firstUnderscore + 1, openParen);
            const levelPart = normalizedFile.substring(openParen + 1, closeParen);

            num = parseInt(numStr, 10);
            jpLevel = levelPart;

            const paddedNum = num.toString().padStart(3, '0');
            title = `${paddedNum}. ${namePart} (${jpLevel})`;
        }
    } catch (e) {
        console.error(`Error parsing parsing filename`, e);
    }

    // Determine Level Requirement
    if (jpLevel && num !== undefined) {
        if (jpLevel === '初級') {
            if (num <= 3) level = 1;
        }
    }

    // Set Difficulty
    if (jpLevel === '初級') { difficulty = 'BEGINNER'; rankTier = 'BEGINNER'; }

    // Calc XP
    const xp_reward = calculateXpReward(
        type,
        level,
        difficulty,
        undefined
    );

    const parseRes = await parseAndValidateQuestions(content);
    if (parseRes.errors.length > 0) {
        console.error(`Skipping due to CSV errors:`);
        parseRes.errors.forEach((err, idx) => console.error(`${idx + 1}: ${err}`));
        return;
    }

    // DB Upsert
    const { data: existing } = await supabase
        .from('programs')
        .select('id')
        .eq('title', title)
        .eq('type', type)
        .maybeSingle();

    console.log(`Existing program found: ${existing?.id || 'None'}`);

    const programPayload = {
        title,
        type,
        category: 'Imported',
        xp_reward,
        level_requirement: level,
        quiz_csv: content,
        is_active: true,
    };

    if (existing) {
        console.log(`Updating Program: ${title} (Req Lv.${level})`);
        const { error } = await supabase.from('programs').update(programPayload).eq('id', existing.id);
        if (error) console.error('Update Error:', error);
        else console.log('Update Success');
    } else {
        console.log(`Creating Program: ${title} (Req Lv.${level})`);
        const { data: newProg, error } = await supabase.from('programs').insert(programPayload).select().single();
        if (error) console.error('Insert Error:', error);
        else console.log('Insert Success:', newProg?.id);
    }
}

main();
