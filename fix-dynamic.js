const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('./app/api', (filePath) => {
    if (filePath.endsWith('route.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Simple fix: if it starts with export const dynamic, move it to after imports
        if (content.startsWith("export const dynamic = 'force-dynamic';")) {
            // Remove it from start
            content = content.replace("export const dynamic = 'force-dynamic';\n\n", "");

            // Find last import
            const lines = content.split('\n');
            let lastImportIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    lastImportIdx = i;
                }
            }

            if (lastImportIdx !== -1) {
                lines.splice(lastImportIdx + 1, 0, '\nexport const dynamic = \'force-dynamic\';');
                content = lines.join('\n');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Fixed export position in', filePath);
            }
        }
    }
});
