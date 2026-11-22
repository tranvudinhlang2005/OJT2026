import fs from 'node:fs';
import path from 'node:path';

const repoRoot = fs.existsSync('FE') ? process.cwd() : path.resolve(process.cwd(), '..');
const TARGET_DIR = path.join(repoRoot, 'FE', 'src');
const EXTENSIONS = new Set(['.tsx']);

const BANNED_PATTERNS = [
  {
    regex: /\bTR\d{2}\b/,
    description: 'Internal specification code (TRxx)',
  },
  {
    regex: /Mã lỗi\s*[:{]/i,
    description: 'Raw error code label (Mã lỗi)',
  },
  {
    regex: />\s*(?:400|401|403|404|409|500)\s*</,
    description: 'Raw HTTP status code in JSX element',
  },
];

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

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of BANNED_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          line: i + 1,
          text: line.trim(),
          description: pattern.description,
        });
      }
    }
  }

  return violations;
}

let totalViolations = 0;
const allFiles = scanDirectory(TARGET_DIR);

for (const file of allFiles) {
  const violations = checkFile(file);
  if (violations.length > 0) {
    totalViolations += violations.length;
    console.error(`\x1b[31m[MINIMALIST-UI VIOLATION]\x1b[0m ${file}:`);
    for (const v of violations) {
      console.error(`  Line ${v.line}: ${v.description} -> "${v.text}"`);
    }
  }
}

if (totalViolations > 0) {
  console.error(`\n\x1b[31mFailed: Found ${totalViolations} Minimalist UI violation(s) in FE/src/.\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32mPassed: 0 Minimalist UI violations found across ${allFiles.length} files in FE/src/.\x1b[0m`);
  process.exit(0);
}
