---
description: Automated pre-flight checks and Git operations for ATLAS v2.0
---

# Commit Workflow

This workflow ensures code quality through automated checks before committing and pushing to the repository.

## Phase 1: Pre-Flight Integrity Checks (Optimized)
Perform these checks to ensure the codebase remains stable and clean. Use parallel execution where possible.

1. **Type Checking (Incremental)**
// turbo
   - Run `npm run --prefix Setup typecheck -- --incremental`
   
2. **Linting (Cached)**
// turbo
   - Run `npm run --prefix Setup lint -- --cache`

3. **Secret Scanning**
// turbo
   - Run `npm run --prefix Setup scan:secrets`

4. **Build Verification (Optional for minor changes)**
// turbo
   - Run `npm run --prefix Setup build:web`

> [!TIP]
> To fasten your workflow, you can run these in parallel if your shell supports it (e.g., using `concurrently` or background jobs).

## Phase 2: Git Operations
Standardized commit process following the Conventional Commits specification.

5. **Stage Changes**
   - Use `git add .` to stage all verified changes.

6. **Create Commit**
   - Use `git commit -m "<type>(<scope>): <description>"`
   - **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
   - **Example**: `feat(web): add authentication login form`

7. **Push to Remote**
   - Use `git push` to synchronize with the remote repository.

---

## 🛑 Stop Conditions
- If **Step 1, 2, or 3** fails, you MUST fix the errors before proceeding.
- If **Step 4** detects a secret, you MUST rotate the secret and remove it from history before committing.
