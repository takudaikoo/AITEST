
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);

async function main() {
    console.log('--- Debugging Tests in DB ---');
    const { data: programs, error } = await supabase
        .from('programs')
        .select('id, title, type, level_requirement, is_active, category')
        //.in('type', ['test', 'exam'])
        .order('title', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${programs.length} tests/exams.`);
    const fs = require('fs');
    fs.writeFileSync('debug-output.json', JSON.stringify(programs, null, 2));
    console.log('Written to debug-output.json');
}

main();
