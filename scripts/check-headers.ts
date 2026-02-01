
import fs from 'fs';
import path from 'path';

const LECTURES_DIR = path.join(process.cwd(), 'imports', 'lectures');

function checkDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir).sort();

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            checkDirectory(fullPath);
        } else if (item.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const cleanContent = content.replace(/^\uFEFF/, '');
            const lines = cleanContent.split('\n');

            // Strict check as in bulk-import.ts (Must start with "# ")
            const h1Line = lines.find(l => l.startsWith('# '));

            if (!h1Line) {
                // Check if it WOULD pass with trim (indicating leading space issue)
                const looseH1 = lines.find(l => l.trim().startsWith('# '));
                if (looseH1) {
                    console.log(`[STRICT FAIL] ${item} (Has leading space?)`);
                } else {
                    console.log(`[NO H1 AT ALL] ${item}`);
                }
            } else {
                // It passed strict check
            }
        }
    }
}

console.log('--- Checking Strict Headers ---');
checkDirectory(LECTURES_DIR);
console.log('--- Done ---');
