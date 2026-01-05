#!/usr/bin/env node
/**
 * Demo Isolation Assertions
 * 
 * SECURITY INVARIANT VERIFICATION
 * This script validates that demo and production code maintain strict separation.
 * 
 * Run before deployment to catch isolation violations.
 * 
 * Usage: node scripts/verify-demo-isolation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERRORS = [];
const WARNINGS = [];

console.log('🔍 Demo Isolation Verification\n');

// 1. Verify /demo/* rules exist in database.rules.json
console.log('✓ Checking Firebase security rules...');
const rulesPath = path.join(__dirname, '../database.rules.json');

if (!fs.existsSync(rulesPath)) {
    ERRORS.push('CRITICAL: database.rules.json not found');
} else {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const rules = JSON.parse(rulesContent);

    if (!rules.rules || !rules.rules.demo) {
        ERRORS.push('CRITICAL: No "demo" rules defined in database.rules.json');
    } else {
        console.log('  ✓ /demo/* rules exist');

        // Verify sessions and sources exist
        if (!rules.rules.demo.sessions) {
            ERRORS.push('CRITICAL: No "demo/sessions" rules defined');
        } else {
            console.log('  ✓ /demo/sessions rules exist');
        }

        if (!rules.rules.demo.sources) {
            ERRORS.push('CRITICAL: No "demo/sources" rules defined');
        } else {
            console.log('  ✓ /demo/sources rules exist');
        }

        // Verify indexes
        if (!rules.rules.demo.sessions['.indexOn']) {
            WARNINGS.push('WARNING: /demo/sessions missing .indexOn');
        }
    }
}

// 2. Verify demo code doesn't write to production paths
console.log('\n✓ Checking demo code paths...');
const demoDir = path.join(__dirname, '../demo');
const productionPaths = [
    'employees/',
    'attendance/',
    'leaves/',
    'audit/',
    'deviceTokens/'
];

console.log(`Debug: Scanning demo dir at: ${demoDir}`);

function scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) {
        console.log(`Debug: Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath, callback);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            callback(filePath);
        }
    });
}

let demoFileCount = 0;
if (fs.existsSync(demoDir)) {
    scanDirectory(demoDir, (filePath) => {
        demoFileCount++;
        const content = fs.readFileSync(filePath, 'utf8');

        productionPaths.forEach(prodPath => {
            // Check for ref(database, 'employees/...') patterns
            const refPattern = new RegExp(`ref\\([^,]+,\\s*['"\`]${prodPath}`, 'g');
            if (refPattern.test(content)) {
                ERRORS.push(`CRITICAL: Demo file writes to production path ${prodPath}: ${filePath}`);
            }
        });
    });
} else {
    ERRORS.push(`CRITICAL: Demo directory not found at ${demoDir}`);
}

console.log(`  ✓ Scanned ${demoFileCount} demo files`);

// 3. Verify production code doesn't reference /demo/*
console.log('\n✓ Checking production code paths...');
const srcDir = path.join(__dirname, '../src');
const backendDir = path.join(__dirname, '../backend/src');

let prodFileCount = 0;
const checkProductionFiles = (filePath) => {
    prodFileCount++;
    const content = fs.readFileSync(filePath, 'utf8');

    // Look for demo/ path references
    if (content.includes('demo/')) {
        const relativePath = path.relative(process.cwd(), filePath);

        // Exceptions: MetricsDashboard and DemoApp imports are allowed
        if (!relativePath.includes('MetricsDashboard') &&
            !relativePath.includes('App.jsx') &&
            !relativePath.includes('firebase.js')) {
            WARNINGS.push(`WARNING: Production file references demo path: ${relativePath}`);
        }
    }
};

scanDirectory(srcDir, checkProductionFiles);
scanDirectory(backendDir, checkProductionFiles);

console.log(`  ✓ Scanned ${prodFileCount} production files`);

// 4. Verify demoGuard exists in backend
console.log('\n✓ Checking Admin SDK protection...');
const guardPath = path.join(__dirname, '../backend/src/utils/demoGuard.js');

if (!fs.existsSync(guardPath)) {
    ERRORS.push('CRITICAL: demoGuard.js not found in backend/src/utils/');
} else {
    console.log('  ✓ Demo guard utility exists');

    // Verify it's imported in firebase.js
    const firebaseConfigPath = path.join(__dirname, '../backend/src/config/firebase.js');
    if (fs.existsSync(firebaseConfigPath)) {
        const firebaseContent = fs.readFileSync(firebaseConfigPath, 'utf8');
        if (!firebaseContent.includes('demoGuard')) {
            ERRORS.push('CRITICAL: demoGuard not imported in firebase.js');
        } else {
            console.log('  ✓ Demo guard integrated in firebase config');
        }
    }
}

// 5. Verify documentation exists
console.log('\n✓ Checking documentation...');
const techRefPath = path.join(__dirname, '../docs/TECHNICAL_REFERENCE.md');

if (fs.existsSync(techRefPath)) {
    const content = fs.readFileSync(techRefPath, 'utf8');
    if (!content.includes('Demo Mode Isolation')) {
        WARNINGS.push('WARNING: TECHNICAL_REFERENCE.md missing "Demo Mode Isolation" section');
    } else {
        console.log('  ✓ Demo isolation documented');
    }
}

// Report Results
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(60));

if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED - Demo isolation is secure\n');
    process.exit(0);
}

if (ERRORS.length > 0) {
    console.log('\n❌ CRITICAL ERRORS FOUND:\n');
    ERRORS.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
    });
}

if (WARNINGS.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    WARNINGS.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn}`);
    });
}

if (ERRORS.length > 0) {
    console.log('\n🚨 PRODUCTION-BLOCKING VIOLATIONS DETECTED');
    console.log('Fix all CRITICAL errors before deployment.\n');
    process.exit(1);
} else {
    console.log('\n✅ No critical errors, but review warnings\n');
    process.exit(0);
}
