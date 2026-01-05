# Engineering Best Practices 🚀

To maintain a high-quality, secure, and velocity-driven codebase, we recommend adopting the following practices.

## 1. Security First 🔒
### Detect Secrets Pre-Commit (Implemented ✅)
*   **What:** A script scans all staged files for patterns like API Keys, Private Keys, and AWS Credentials.
*   **Why:** Prevents accidental leaks *before* they enter git history.
*   **Command:** `node scripts/check-secrets.js` (Runs automatically via Husky).

### No `.env` in Repo
*   **Practice:** Never commit `.env`. Use `.env.example` for templates.
*   **Verification:** Add `.env` to `.gitignore` (Done).

## 2. Code Quality & Consistency 💎
### Strict Type Checking (`tsc`)
*   **Why:** Catch bugs at compile time, not runtime. The IDE catches some, but a full build check catches everything.
*   **Automation:** Add `tsc --noEmit` to the pre-commit hook.

### Linter & Formatter (ESLint + Prettier)
*   **Why:** "Format on Save" ensures everyone's code looks the same. ESLint catches bad patterns (e.g., unused vars).
*   **Setup:**
    *   `npm install --save-dev prettier eslint-config-prettier`
    *   Add `.prettierrc`
    *   Run `npx prettier --write .` on commit.

## 3. Deployment Strategy 🚀
### Branch Protection
*   **Rules:**
    *   Lock `main` branch (No direct pushes).
    *   Require Pull Requests (PRs).
    *   Require Status Checks (Build must pass) before merge.
    *   (GitHub Settings -> Branches -> Add Rule).

### CI/CD Pipelines (GitHub Actions)
*   **Workflow:**
    1.  **On PR:** Run Build + Tests + Lint.
    2.  **On Merge to Main:** Automatically Deploy to Firebase Hosting.
*   **Benefit:** Zero manual deployments. "If it's in main, it's live."

## 4. Documentation 📚
### "Docs as Code"
*   Keep technical docs (`OWNER_MODULE.md`, `LEGACY_ANALYSIS.md`) close to the code in `docs/technical`.
*   Update docs in the *same PR* as the feature validation.

---
*Recommended Roadmap:*
1.  ✅ Secret Scanning
2.  [ ] Setup GitHub Actions for Build Verification
3.  [ ] Enforce `tsc` on pre-commit
