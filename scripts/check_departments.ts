
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

async function main() {
    const env = loadEnv();
    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY!
    );

    console.log('--- Departments ---');
    const { data: depts, error: deptError } = await supabase.from('departments').select('*');
    if (deptError) console.error(deptError);
    else console.table(depts);

    console.log('\n--- First 20 Profiles ---');
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select(`
            id, 
            email, 
            full_name, 
            department_id, 
            departments(name),
            role
        `)
        .limit(20);

    if (profError) {
        console.error(profError);
    } else {
        console.table(profiles?.map(p => ({
            email: p.email,
            name: p.full_name,
            deptID: p.department_id,
            deptName: (p.departments as any)?.name,
            role: p.role
        })));
    }
}

main().catch(console.error);
