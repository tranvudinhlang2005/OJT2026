import fs from 'node:fs';
import path from 'node:path';

const repoRoot = fs.existsSync('FE') ? process.cwd() : path.resolve(process.cwd(), '..');
const TARGET_DIRS = [path.join(repoRoot, 'FE', 'src'), path.join(repoRoot, 'FE', 'e2e')];
const EXTENSIONS = new Set(['.ts', '.tsx']);

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function stripStringLiterals(line) {
  return line
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = stripStringLiterals(line);

    if (stripped.includes('//') || stripped.includes('/*') || stripped.includes('*/')) {
      violations.push({ line: i + 1, text: line.trim() });
    }
  }

  return violations;
}

let totalViolations = 0;
const allFiles = TARGET_DIRS.flatMap((dir) => scanDirectory(dir));

for (const file of allFiles) {
  const violations = checkFile(file);
  if (violations.length > 0) {
    totalViolations += violations.length;
    console.error(`\x1b[31m[COMMENT VIOLATION]\x1b[0m ${file}:`);
    for (const v of violations) {
      console.error(`  Line ${v.line}: ${v.text}`);
    }
  }
}

if (totalViolations > 0) {
  console.error(`\n\x1b[31mFailed: Found ${totalViolations} comment(s) in FE source code (no-comments rule).\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32mPassed: 0 comments found across ${allFiles.length} files in FE.\x1b[0m`);
  process.exit(0);
}
