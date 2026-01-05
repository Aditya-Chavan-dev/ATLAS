const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const SECRET_PATTERNS = [
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
    { name: 'Firebase Service Account', regex: /"type": "service_account"/ },
    { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Generic Secret', regex: /secret\s*[:=]\s*['"][a-zA-Z0-9]{10,}['"]/i }
];

const IGNORED_FILES = [
    'package-lock.json',
    'scripts/check-secrets.cjs',
    'dist/',
    'node_modules/'
];

function getStagedFiles() {
    try {
        const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
        return output.split('\n').filter(f => f.trim() && !IGNORED_FILES.some(i => f.startsWith(i)));
    } catch (e) {
        return [];
    }
}

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf-8');
    const errors = [];

    SECRET_PATTERNS.forEach(pattern => {
        if (pattern.regex.test(content)) {
            errors.push(pattern.name);
        }
    });

    return errors;
}

console.log(`${YELLOW}🔒 Starting Security Scan...${RESET}`);

const stagedFiles = getStagedFiles();
let hasErrors = false;

stagedFiles.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
        console.error(`${RED}❌ Potential secret found in ${file}: ${issues.join(', ')}${RESET}`);
        hasErrors = true;
    }
});

if (hasErrors) {
    console.error(`\n${RED}⛔ COMMIT BLOCKED: Secrets detected in staged files.${RESET}`);
    console.error(`${YELLOW}Please remove secrets or add to .gitignore/.secretsignore before committing.${RESET}`);
    process.exit(1);
} else {
    console.log(`${GREEN}✅ Security Scan Passed.${RESET}`);
    process.exit(0);
}
