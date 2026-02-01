const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'imports', 'lectures');

// Helper to pad numbers to 3 digits
function padNumber(num) {
    return num.toString().padStart(3, '0');
}

// Helper to sanitize filenames
function sanitizeFilename(name) {
    // Replace spaces with underscore, remove illicit chars
    return name.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
}

function processFiles() {
    console.log(`Scanning directory: ${rootDir}`);
    
    if (!fs.existsSync(rootDir)) {
        console.error(`Directory not found: ${rootDir}`);
        return;
    }

    const subDirs = fs.readdirSync(rootDir).filter(file => {
        return fs.statSync(path.join(rootDir, file)).isDirectory();
    });

    console.log(`Found subdirectories: ${subDirs.join(', ')}`);

    let processedCount = 0;
    let errorCount = 0;

    subDirs.forEach(dir => {
        const dirPath = path.join(rootDir, dir);
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 1. Extract Title and Number from H1
            // Looks for "# 01. Title" or "# 1. Title"
            const titleMatch = content.match(/^#\s*(\d+)\.?\s*(.+?)(\r?\n|$)/);
            
            if (!titleMatch) {
                console.warn(`[SKIP] Could not parse title in: ${dir}/${file}`);
                return;
            }

            const rawNumber = titleMatch[1];
            const rawTitle = titleMatch[2].trim();
            const newNumber = padNumber(rawNumber);
            const saneTitle = sanitizeFilename(rawTitle);
            
            const newBaseName = `${newNumber}_${saneTitle}`;
            
            // 2. Split Content
            // Look for the separator before the CSV header
            // The file usually ends with:
            // ---
            // 
            // content,question_type...
            
            const csvHeaderMarker = 'content,question_type';
            const splitIndex = content.lastIndexOf('---');
            
            let mdContent = '';
            let csvContent = '';
            let hasCsv = false;

            if (splitIndex !== -1) {
                // Check if CSV header follows
                const postSplit = content.substring(splitIndex);
                if (postSplit.includes(csvHeaderMarker)) {
                   mdContent = content.substring(0, splitIndex).trim();
                   // Extract CSV part, skipping the '---' line and any whitespace
                   const csvPart = content.substring(splitIndex + 3).trim(); 
                   // Ensure we start cleanly from content,question_type if there's extra junk
                   const headerIndex = csvPart.indexOf(csvHeaderMarker);
                   if (headerIndex !== -1) {
                       csvContent = csvPart.substring(headerIndex);
                       hasCsv = true;
                   }
                }
            }

            // Fallback if split logic fails but we want to rename anyway?
            // User requirement: "MDファイルから---を削除し、CSVの部分だけを切り取り"
            // If no CSV found, just rename the MD file? Or skip?
            // Assuming strict structure for now, but handle gracefully.
            
            if (!hasCsv) {
                console.warn(`[SKIP] No CSV section found in: ${dir}/${file}`);
                // If it's just a rename request effectively, we could proceed, 
                // but user specifically asked to split. Let's log it.
                return;
            }

            // 3. Write New Files
            const newMdPath = path.join(dirPath, `${newBaseName}.md`);
            const newCsvPath = path.join(dirPath, `${newBaseName}_確認問題.csv`);
            
            try {
                fs.writeFileSync(newMdPath, mdContent);
                fs.writeFileSync(newCsvPath, csvContent);
                console.log(`[OK] Created: ${newBaseName}.md & .csv`);
                
                // 4. Delete Old File
                // Only if new filename is different (it should be)
                if (newMdPath !== filePath) {
                    fs.unlinkSync(filePath);
                   // console.log(`[DEL] Removed: ${file}`);
                }
                processedCount++;
            } catch (err) {
                console.error(`[ERR] Failed to write/delete for ${dir}/${file}:`, err);
                errorCount++;
            }
        });
    });

    console.log(`\nProcessing Complete.`);
    console.log(`Processed: ${processedCount}`);
    console.log(`Errors/Skipped: ${errorCount}`);
}

processFiles();
