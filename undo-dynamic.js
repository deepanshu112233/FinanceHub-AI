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
        if (content.includes("export const dynamic = 'force-dynamic';")) {
            content = content.replace("export const dynamic = 'force-dynamic';\n", "");
            content = content.replace("export const dynamic = 'force-dynamic';", "");
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Removed export dynamic from', filePath);
        }
    }
});
