
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const TESTS_DIR = path.join(process.cwd(), 'imports', 'test');

const TOPIC_MAP: Record<string, string> = {
    'basics': '環境・基礎',
    'efficiency': '業務効率化',
    'data': 'データ活用',
    'nocode': 'ノーコード',
    'communication': 'コミュニケーション',
    'career': 'キャリアスキル',
    'creative': 'クリエイティブ',
    'ethics': '倫理・セキュリティ',
    'usecases': 'ユースケース',
    'mindset': 'マインドセット'
};

const LEVEL_MAP: Record<string, string> = {
    'beginner': '初級',
    'intermediate': '中級',
    'advanced': '上級'
};

async function main() {
    console.log('--- Starting Test Refinement ---');

    // 1. Rename Files
    if (fs.existsSync(TESTS_DIR)) {
        const files = fs.readdirSync(TESTS_DIR);
        for (const file of files) {
            // Match: test_01_basics_beginner.csv
            const match = file.match(/test_(\d+)_([a-z0-9]+)_([a-z]+)\.csv/);
            if (match) {
                const num = match[1];
                const slug = match[2];
                const diffSlug = match[3];

                const jpCategory = TOPIC_MAP[slug] || slug;
                const jpLevel = LEVEL_MAP[diffSlug] || diffSlug;

                // New Name: 01_環境・基礎(初級).csv
                const newName = `${num}_${jpCategory}(${jpLevel}).csv`;
                const oldPath = path.join(TESTS_DIR, file);
                const newPath = path.join(TESTS_DIR, newName);

                console.log(`Renaming: ${file} -> ${newName}`);
                fs.renameSync(oldPath, newPath);
            }
        }
    }

    // 2. Generate Certification Exams
    // "Balance well" implies taking questions from all topics for that level.
    // We will generate: 認定試験(初級).csv, 認定試験(中級).csv, 認定試験(上級).csv

    // Config: 60 questions, 200 points total. (Suspend point calc, just make 60 questions?)
    // User said "60 questions, 200 points full score". 
    // Approx 3.3 points per question? Or distribute differently?
    // Let's set default points to 3 or 4. 20 * 3 + 40 * 3.5?
    // Maybe just 3 points for all (180) + 20 bonus?
    // Let's set 3 points for 40 questions, 4 points for 20 questions.
    // Or just 100 points scale * 2?
    // Let's set 'points' column to roughly 3 or 4.

    const levels = ['初級', '中級', '上級']; // matching Japanese filenames

    for (const level of levels) {
        console.log(`Generating Certification Exam for ${level}...`);

        // Gather all questions from this level's CSVs
        let allQuestions: any[] = [];
        const files = fs.readdirSync(TESTS_DIR).filter(f => f.includes(`(${level}).csv`) && !f.startsWith('認定試験'));

        for (const file of files) {
            const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8').replace(/^\uFEFF/, '');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            allQuestions = allQuestions.concat(parsed.data);
        }

        if (allQuestions.length < 60) {
            console.warn(`Not enough source questions for ${level} (Found ${allQuestions.length}, need 60). Using all.`);
        }

        // Shuffle and Pick 60
        // We want "balanced style". Maybe take ~6 questions from each of the 10 topics if 10 files exist.
        // Actually we have 10 files (01-10). So taking 6 from each is perfect.

        let examQuestions: any[] = [];
        // Group by source file logic is hard since we just concatenated.
        // Let's re-read by file to ensure balance.

        examQuestions = [];
        const filesSorted = files.sort(); // 01...10
        const questionsPerTopic = Math.floor(60 / filesSorted.length); // likely 6
        const remainder = 60 % filesSorted.length;

        for (let i = 0; i < filesSorted.length; i++) {
            const file = filesSorted[i];
            const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8').replace(/^\uFEFF/, '');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            const records = parsed.data as any[];

            // Randomly shuffle records
            const shuffled = records.sort(() => 0.5 - Math.random());

            const countToTake = questionsPerTopic + (i < remainder ? 1 : 0);
            const selected = shuffled.slice(0, countToTake);

            // Adjust points?
            // User requested 200 points total. 60 questions.
            // 3.33 pts avg.
            // Let's set generated points to 3 for standard, 4 for hard?
            // Or just make integer points: 40 questions @ 3pts = 120, 20 questions @ 4pts = 80? Total 200.
            // We will assign points sequentially.

            examQuestions = examQuestions.concat(selected);
        }

        // Final shuffle of the exam
        examQuestions = examQuestions.sort(() => 0.5 - Math.random());

        // Assign points
        examQuestions.forEach((q, idx) => {
            // First 40: 3 pts. Last 20: 4 pts.
            q.points = idx < 40 ? 3 : 4;
        });

        // Write to CSV
        // Need to reconstruct CSV with same headers
        if (examQuestions.length > 0) {
            const csv = Papa.unparse(examQuestions);
            const outPath = path.join(TESTS_DIR, `認定試験_${level}.csv`);
            fs.writeFileSync(outPath, '\uFEFF' + csv); // Add BOM for Excel compatibility
            console.log(`Created: ${outPath} with ${examQuestions.length} questions.`);
        }
    }
}

main().catch(console.error);
