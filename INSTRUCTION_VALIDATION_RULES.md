# AI Instruction Validation Rules

> [!CAUTION] 
> 🔒 LOCKED SECTION - AI SYSTEM SAFEGUARDS
> This checklist must be manually passed before adding any new rules to the AI instruction files (`CLAUDE.md` / `GEMINI.md`, `.cursorrules`, etc.) or workflows.

## The Checklist
Every new AI instruction must satisfy all of the following conditions. If it fails even ONE, it must be rejected.

1. **Free Tier Compliance**
   - Does it require Firebase Cloud Functions? (Reject)
   - Does it require a paid GCP service? (Reject)
   - Does it rely on Firestore? (Reject — we use RTDB exclusively)

2. **Single Source of Truth**
   - Does it define a type (e.g., `User`) that should exist in `packages/shared/src/types.ts`? (Reject — types must exclusively live there)
   - Does it introduce a new role beyond `'employee'` and `'md'`? (Reject — consult PRD first)

3. **Backend Independence**
   - Does it assume a Node.js/Express backend? (Reject — backend is 100% Client-Side + RTDB Rules)

4. **Module Resolution**
   - Does the instruction suggest importing from `@atlas/shared/types` instead of using the barrel export, or does it bypass `@atlas/shared` altogether? (Flag for correction)

## Automated Rejection Triggers
If an AI agent suggests a workflow or modification containing any of the following banned keywords in the context of architecture, it must automatically self-correct:
- `Cloud Functions`
- `Express`
- `Firestore`
- `Node.js server`
- `Blaze Plan`
