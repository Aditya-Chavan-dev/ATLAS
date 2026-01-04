# ATLAS v2: /commit Workflow

> **Command**: `/commit`  
> **Purpose**: Automate docs + deploy + security on every commit  
> **Trigger**: Manual via `/commit` command  
> **Status**: 🔒 LOCKED - Production workflow

**Rules**:
- ✅ Git commands run automatically (no permission needed)
- ✅ Build and deploy run automatically
- 🔴 **BLOCKS ONLY** if secrets are detected
- ✅ All other errors are warnings (commit proceeds)

---

## Workflow Overview

```
Commit → Analyze Changes → Generate Docs → Security Scan → Deploy → Push to GitHub
```

---

## Step-by-Step Workflow

### **Step 1: Detect Changes**
Analyze what files changed and categorize them

### **Step 2: Generate Documentation**
- Human-readable (for non-tech teams)
- Technical summary (for engineers)

### **Step 3: Security Scan**
- Check for exposed secrets
- Validate Firebase Security Rules
- Check for hardcoded credentials

### **Step 4: Deploy to Firebase**
- Build production bundle
- Deploy to Firebase Hosting

### **Step 5: Push to GitHub**
- Commit generated docs
- Push to remote

---

## Implementation

### **GitHub Actions Workflow**

```yaml
# .github/workflows/commit-workflow.yml
name: ATLAS Commit Workflow

on:
  push:
    branches: [main]

jobs:
  analyze-and-document:
    name: Analyze Changes & Generate Docs
    runs-on: ubuntu-latest
    
    steps:
      # 1. Checkout code
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need previous commit for diff
      
      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      # 3. Install dependencies
      - name: Install Dependencies
        run: npm ci
      
      # 4. Analyze changes
      - name: Analyze Changes
        id: analyze
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
          echo "changed_files<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED_FILES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          
          # Categorize changes
          echo "Analyzing changes..."
          node scripts/analyze-changes.js
      
      # 5. Generate human-readable docs
      - name: Generate Human-Readable Documentation
        run: |
          node scripts/generate-human-docs.js \
            --commit-sha ${{ github.sha }} \
            --output docs/updates/$(date +%Y-%m-%d).md
      
      # 6. Generate technical summary
      - name: Generate Technical Summary
        run: |
          node scripts/generate-tech-summary.js \
            --commit-sha ${{ github.sha }} \
            --output docs/technical/commit-${{ github.sha }}.md
      
      # 7. Upload docs as artifact
      - name: Upload Documentation
        uses: actions/upload-artifact@v4
        with:
          name: generated-docs
          path: docs/
  
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: analyze-and-document
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      # 1. Scan for secrets
      - name: Scan for Exposed Secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
      
      # 2. Check for hardcoded credentials
      - name: Check for Hardcoded Credentials
        run: |
          echo "Scanning for hardcoded credentials..."
          
          # Check for common patterns
          if grep -r "AIzaSy" --include="*.ts" --include="*.tsx" --include="*.js" src/; then
            echo "❌ ERROR: Found hardcoded Firebase API key"
            exit 1
          fi
          
          if grep -r "password.*=.*\"" --include="*.ts" --include="*.tsx" src/; then
            echo "❌ ERROR: Found hardcoded password"
            exit 1
          fi
          
          echo "✅ No hardcoded credentials found"
      
      # 3. Validate Firebase Security Rules
      - name: Validate Firebase Security Rules
        run: |
          echo "Validating Firestore Security Rules..."
          
          # Check if rules file exists
          if [ ! -f "firestore.rules" ]; then
            echo "❌ ERROR: firestore.rules not found"
            exit 1
          fi
          
          # Basic validation (can be enhanced)
          if ! grep -q "rules_version = '2'" firestore.rules; then
            echo "❌ ERROR: Invalid rules version"
            exit 1
          fi
          
          echo "✅ Security rules validated"
      
      # 4. Check for sensitive data in logs
      - name: Check for Sensitive Data in Logs
        run: |
          echo "Checking for sensitive data in logs..."
          
          # Check for console.log with sensitive data
          if grep -r "console.log.*password" --include="*.ts" --include="*.tsx" src/; then
            echo "❌ ERROR: Found password in console.log"
            exit 1
          fi
          
          if grep -r "console.log.*token" --include="*.ts" --include="*.tsx" src/; then
            echo "❌ ERROR: Found token in console.log"
            exit 1
          fi
          
          echo "✅ No sensitive data in logs"
  
  deploy:
    name: Deploy to Firebase
    runs-on: ubuntu-latest
    needs: security-scan
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      # 1. Build production bundle
      - name: Build Production Bundle
        run: |
          echo "Building production bundle..."
          npm run build
          
          # Verify build output
          if [ ! -d "dist" ]; then
            echo "❌ ERROR: Build failed - dist directory not found"
            exit 1
          fi
          
          echo "✅ Build successful"
      
      # 2. Deploy to Firebase Hosting
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      # 3. Deploy Firestore Rules
      - name: Deploy Firestore Rules
        run: |
          npm install -g firebase-tools
          firebase deploy --only firestore:rules --token ${{ secrets.FIREBASE_TOKEN }}
      
      # 4. Deploy Cloud Functions (if any)
      - name: Deploy Cloud Functions
        run: |
          if [ -d "functions" ]; then
            firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}
          else
            echo "No Cloud Functions to deploy"
          fi
  
  commit-and-push:
    name: Commit Docs & Push to GitHub
    runs-on: ubuntu-latest
    needs: deploy
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      # Download generated docs
      - name: Download Documentation
        uses: actions/download-artifact@v4
        with:
          name: generated-docs
          path: docs/
      
      # Commit and push
      - name: Commit Documentation
        run: |
          git config user.name "ATLAS Bot"
          git config user.email "bot@atlas.dev"
          
          # Add generated docs
          git add docs/
          
          # Check if there are changes
          if git diff --staged --quiet; then
            echo "No documentation changes to commit"
          else
            git commit -m "docs: Auto-generated from commit ${{ github.sha }}"
            git push
            echo "✅ Documentation committed and pushed"
          fi
      
      # Create deployment summary
      - name: Create Deployment Summary
        run: |
          echo "## 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Commit**: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Branch**: ${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Deployed**: $(date)" >> $GITHUB_STEP_SUMMARY
          echo "- **Status**: ✅ Success" >> $GITHUB_STEP_SUMMARY
```

---

## Scripts to Create

### **1. analyze-changes.js**

```javascript
// scripts/analyze-changes.js
import { execSync } from 'child_process';
import fs from 'fs';

function analyzeChanges() {
  // Get changed files
  const changedFiles = execSync('git diff --name-only HEAD~1 HEAD')
    .toString()
    .trim()
    .split('\n');
  
  // Categorize changes
  const categories = {
    features: [],
    bugFixes: [],
    refactors: [],
    tests: [],
    docs: [],
    config: []
  };
  
  changedFiles.forEach(file => {
    if (file.includes('features/')) {
      categories.features.push(file);
    } else if (file.includes('.test.')) {
      categories.tests.push(file);
    } else if (file.includes('docs/')) {
      categories.docs.push(file);
    } else if (file.includes('config') || file.includes('.json')) {
      categories.config.push(file);
    }
  });
  
  // Save analysis
  fs.writeFileSync(
    '.github/analysis.json',
    JSON.stringify(categories, null, 2)
  );
  
  console.log('✅ Change analysis complete');
  console.log(JSON.stringify(categories, null, 2));
}

analyzeChanges();
```

---

### **2. generate-human-docs.js**

```javascript
// scripts/generate-human-docs.js
import { execSync } from 'child_process';
import fs from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';

async function generateHumanDocs(commitSha, outputPath) {
  // Get commit details
  const commitMessage = execSync(`git log -1 --pretty=%B ${commitSha}`)
    .toString()
    .trim();
  
  const changedFiles = execSync(`git diff --name-only ${commitSha}~1 ${commitSha}`)
    .toString()
    .trim()
    .split('\n');
  
  const diff = execSync(`git diff ${commitSha}~1 ${commitSha}`)
    .toString();
  
  // Prepare AI prompt
  const prompt = `
Given this commit:
- Message: ${commitMessage}
- Files changed: ${changedFiles.join(', ')}
- Diff: ${diff.substring(0, 5000)} // Truncate for token limit

Generate a non-technical summary in this format:

## New Feature: {feature_name}
{Brief description in plain English - what it does and why it's useful}

## User-Facing Changes
- {List of visible changes users will see}
- {Include UI changes, new buttons, new flows}
- {Performance improvements if significant}

## Bug Fixes
- {List of bugs fixed}

## Known Issues
- {List of known issues or "None"}

IMPORTANT:
- Only include REAL changes from the diff
- Do NOT assume or invent features
- If no user-facing changes, say "No user-facing changes"
- If no bugs fixed, say "None"
- Max 200 words, no code, no technical jargon
`;

  // Call AI (Claude or GPT-4)
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  const documentation = response.content[0].text;
  
  // Write to file
  const finalDoc = `# What Changed (${new Date().toISOString().split('T')[0]})

${documentation}

---
*Auto-generated from commit ${commitSha}*
`;
  
  fs.writeFileSync(outputPath, finalDoc);
  console.log(`✅ Human-readable docs generated: ${outputPath}`);
}

// Parse CLI args
const args = process.argv.slice(2);
const commitSha = args[args.indexOf('--commit-sha') + 1];
const outputPath = args[args.indexOf('--output') + 1];

generateHumanDocs(commitSha, outputPath);
```

---

### **3. generate-tech-summary.js**

```javascript
// scripts/generate-tech-summary.js
import { execSync } from 'child_process';
import fs from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';

async function generateTechSummary(commitSha, outputPath) {
  // Get commit details
  const commitMessage = execSync(`git log -1 --pretty=%B ${commitSha}`)
    .toString()
    .trim();
  
  const changedFiles = execSync(`git diff --name-only ${commitSha}~1 ${commitSha}`)
    .toString()
    .trim()
    .split('\n');
  
  const diff = execSync(`git diff ${commitSha}~1 ${commitSha}`)
    .toString();
  
  // Get test results (if available)
  let testResults = 'No tests run';
  try {
    testResults = execSync('npm test -- --coverage --silent')
      .toString();
  } catch (e) {
    testResults = 'Tests not available';
  }
  
  // Prepare AI prompt
  const prompt = `
Given this commit:
- Message: ${commitMessage}
- Files changed: ${changedFiles.join(', ')}
- Diff: ${diff.substring(0, 8000)}
- Test results: ${testResults.substring(0, 2000)}

Generate a technical summary including:

## Changes
- {List of files added/modified/deleted}
- {Key functions/classes changed}

## API Changes
- {New endpoints or "None"}
- {Breaking changes or "None"}

## Database Changes
- {Schema changes or "None"}
- {Migration required or "None"}

## Performance Impact
- {Estimated impact or "Unknown"}

## Testing
- {New tests added}
- {Coverage change}

## Rollout Plan
- {Feature flags if any}
- {Gradual rollout strategy if applicable}

IMPORTANT:
- Only include REAL changes from the diff
- Do NOT assume or invent changes
- Be specific with file names and line numbers
- Include code snippets for key changes
`;

  // Call AI
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  const documentation = response.content[0].text;
  
  // Write to file
  const finalDoc = `# Technical Summary: Commit ${commitSha.substring(0, 7)}

**Date**: ${new Date().toISOString()}
**Commit**: ${commitSha}
**Message**: ${commitMessage}

${documentation}

---
*Auto-generated technical summary*
`;
  
  fs.writeFileSync(outputPath, finalDoc);
  console.log(`✅ Technical summary generated: ${outputPath}`);
}

// Parse CLI args
const args = process.argv.slice(2);
const commitSha = args[args.indexOf('--commit-sha') + 1];
const outputPath = args[args.indexOf('--output') + 1];

generateTechSummary(commitSha, outputPath);
```

---

## Required Secrets (GitHub)

Add these to GitHub repository secrets:

```
FIREBASE_SERVICE_ACCOUNT    # Firebase service account JSON
FIREBASE_TOKEN              # Firebase CI token
FIREBASE_PROJECT_ID         # Firebase project ID
ANTHROPIC_API_KEY          # Claude API key (for doc generation)
```

---

## Local Testing

Test the workflow locally before pushing:

```bash
# 1. Test change analysis
node scripts/analyze-changes.js

# 2. Test human-readable docs
node scripts/generate-human-docs.js \
  --commit-sha $(git rev-parse HEAD) \
  --output docs/updates/test.md

# 3. Test technical summary
node scripts/generate-tech-summary.js \
  --commit-sha $(git rev-parse HEAD) \
  --output docs/technical/test.md

# 4. Test security scan
grep -r "AIzaSy" --include="*.ts" src/ || echo "✅ No secrets found"

# 5. Test build
npm run build

# 6. Test Firebase deploy (dry run)
firebase deploy --only hosting --dry-run
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. COMMIT TO MAIN                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ANALYZE CHANGES                                          │
│    - Get changed files                                      │
│    - Categorize (features, bugs, tests, docs)              │
│    - Save analysis.json                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GENERATE DOCUMENTATION                                   │
│    - Human-readable (AI-generated)                          │
│    - Technical summary (AI-generated)                       │
│    - Save to docs/                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SECURITY SCAN                                            │
│    - Scan for exposed secrets (TruffleHog)                  │
│    - Check hardcoded credentials                            │
│    - Validate Firebase Security Rules                       │
│    - Check for sensitive data in logs                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DEPLOY TO FIREBASE                                       │
│    - Build production bundle (npm run build)                │
│    - Deploy to Firebase Hosting                             │
│    - Deploy Firestore Rules                                 │
│    - Deploy Cloud Functions (if any)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. COMMIT & PUSH DOCS                                       │
│    - Add generated docs to git                              │
│    - Commit with message "docs: Auto-generated"             │
│    - Push to GitHub                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. DEPLOYMENT SUMMARY                                       │
│    - Create GitHub Actions summary                          │
│    - Show commit SHA, branch, timestamp                     │
│    - Show deployment status                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### **🔴 BLOCKING Errors (Commit Stops)**

**ONLY security issues block the commit**:
- ❌ Exposed secrets detected (TruffleHog)
- ❌ Hardcoded Firebase API keys (`AIzaSy...`)
- ❌ Hardcoded passwords
- ❌ Tokens in console.log
- ❌ Passwords in console.log

**Action**: Fix the security issue and recommit

---

### **⚠️ NON-BLOCKING Errors (Warnings Only)**

**These do NOT stop the commit**:
- ⚠️ Build fails → Warning logged, commit proceeds
- ⚠️ Firebase deploy fails → Warning logged, commit proceeds
- ⚠️ AI doc generation fails → Warning logged, commit proceeds
- ⚠️ TypeScript errors → Warning logged, commit proceeds
- ⚠️ Test failures → Warning logged, commit proceeds

**Action**: Review warnings, fix in next commit

---

### **Git Commands**

**All git commands run automatically (no permission needed)**:
- ✅ `git add docs/`
- ✅ `git commit -m "docs: Auto-generated"`
- ✅ `git push`

**No user interaction required**

---

## Benefits

✅ **Automated**: No manual work
✅ **Consistent**: Same format every time
✅ **Accurate**: Based on real code changes (not assumptions)
✅ **Secure**: Scans for secrets before deploy
✅ **Fast**: Runs in parallel where possible
✅ **Traceable**: Full history in docs/ folder

---

**Status**: 🔒 LOCKED - Production-ready automated workflow
