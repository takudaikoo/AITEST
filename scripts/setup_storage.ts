
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        return {};
    }
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
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('Missing credentials in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('Creating bucket: lecture-assets...');
    const { data, error } = await supabase.storage.createBucket('lecture-assets', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket already exists.');
        } else {
            console.error('Error creating bucket:', error);
        }
    } else {
        console.log('Bucket created successfully:', data);
    }

    // List buckets to verify
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('Current buckets:', buckets?.map(b => b.name));
}

main().catch(console.error);
