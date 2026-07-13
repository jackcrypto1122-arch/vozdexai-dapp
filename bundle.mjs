import fs from 'fs';
import path from 'path';

console.log("Generating codebase.md...");
const outPath = 'dapp-codebase.md';
const srcDirs = ['src', 'app'];
let output = '# Dapp Codebase\n\n';

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.md'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const ext = path.extname(fullPath).substring(1);
            output += `## ${fullPath.replace(/\\/g, '/')}\n\`\`\`${ext === 'tsx' || ext === 'ts' ? 'typescript' : ext}\n${content}\n\`\`\`\n\n`;
        }
    }
}

srcDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        walk(dir);
    }
});

fs.writeFileSync(outPath, output);
console.log(`Successfully created ${outPath}`);
