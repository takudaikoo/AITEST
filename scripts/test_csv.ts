import Papa from 'papaparse';

const csvBody = `content,question_type,option_1,option_2,option_3,option_4,correct_indices,explanation,difficulty,points,tags,category
"Google WorkspaceにおけるGeminiの特徴として、**誤っている**ものはどれですか？",single,"Gmailやドキュメントなどのツール内で直接AI機能を利用できる","企業向けプランでは、入力データはAIの学習に使用されない","テキスト情報のみを処理でき、画像や音声は認識できない","スプレッドシートの数式生成やデータ整理をサポートする",3,"GeminiはマルチモーダルAIであり、テキストだけでなく画像、音声、動画も認識・処理することができます。その他の選択肢は正しい特徴です。",1,10,"Gemini,Google Workspace,基礎知識","環境・基礎"`;

// Prepend BOM
const csv = '\uFEFF' + csvBody;

const parseAndValidateQuestions = (fileContent: string): Promise<any> => {
    return new Promise((resolve) => {
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const errors: string[] = [];
                results.data.forEach((row: any, index) => {
                    const rowNum = index + 2;

                    if (!row.content) {
                        // Check if BOM caused a weird key
                        console.log("Keys found:", Object.keys(row));
                        errors.push(`Row ${rowNum}: 'content' is required.`);
                        return;
                    }
                    if (!row.question_type) {
                        errors.push(`Row ${rowNum}: 'question_type' is required.`);
                        return;
                    }
                    // ... (rest of validation)
                });
                resolve({ errors });
            },
            error: (err: any) => resolve({ errors: [err.message] })
        });
    });
};

async function run() {
    console.log("Testing with BOM...");
    const result = await parseAndValidateQuestions(csv);
    console.log("Errors:", result.errors);
}

run();
