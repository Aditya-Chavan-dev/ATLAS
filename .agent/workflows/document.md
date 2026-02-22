---
description: Documents a completed feature in full detail across all audiences. Invoked manually by the user after a feature is complete.
globs:
alwaysApply: false
---

# /document — Feature Documentation Rule

## When This Rule Activates

This rule activates ONLY when the user explicitly types /document in the chat. Do not apply this rule automatically. Do not apply it partially. When invoked, execute every step below in order without skipping.

---

## Step 1: Identify What to Document

Before writing anything, determine what feature is being documented.

- If the user typed /document [feature name] — document that specific feature.
- If the user typed just /document with no name — look at the most recently modified or most recently discussed files in the conversation and infer which feature was just completed. If you are still unsure, ask the user: "Which feature should I document?" and wait for their answer before proceeding.
- Do not guess randomly. Do not document multiple features at once unless the user explicitly asks.

Once the feature is identified, read ALL of the following before writing a single word:
- Every frontend file involved (components, pages, hooks, context, state management)
- Every backend file involved (routes, controllers, middleware, services, helper functions)
- Every database file involved (models, schemas, migrations, seed files, query files)
- Any configuration files relevant to this feature (env variables used, third-party service configs)
- Any existing documentation or comments in the code that describe intent

If any of these files are ambiguous or you cannot find them, state which files you could not locate at the end of your response. Do not silently skip them.

---

## Step 2: Create the Feature File

Create a new file at this exact path:

docs/features/FEATURE_[NAME].md

Where [NAME] is the feature name in SCREAMING_SNAKE_CASE. Examples:
- User Login → FEATURE_USER_LOGIN.md
- Image Upload → FEATURE_IMAGE_UPLOAD.md
- Search and Filter → FEATURE_SEARCH_AND_FILTER.md

If the docs/features/ directory does not exist, create it.

If a file for this feature already exists, do not overwrite it silently. Tell the user: "A file for this feature already exists at [path]. Should I overwrite it or create a new version?" and wait for their answer.

---

## Step 3: Write the Feature File

Write the file using EXACTLY the structure below. Every section is mandatory. Do not skip sections. Do not merge sections. Do not add sections not listed here.

For every section, the rule is: write what actually exists in the code, not what should exist or might exist. If something is not implemented, say so explicitly. Never fabricate behavior.

---

# Feature: [Human-readable feature name — Title Case, no abbreviations]

> **Status:** Complete
> **Date Completed:** [Today's date in DD/MM/YYYY format]
> **Part of:** [The module, page, or section of the app this belongs to — be specific]
> **Files Involved:** [Comma-separated list of every file touched, with paths relative to project root]

---

## 1. What This Feature Does (User-Facing)

Write exactly 3–5 sentences. Describe the complete user experience from start to finish.

Rules for this section:
- No technical terms whatsoever. No mention of APIs, databases, tokens, state, hooks, requests, or responses.
- Write as if explaining to a first-time user who has never used software before.
- Cover: what the user sees, what action they take, what happens immediately after, and what the final outcome is.
- If the feature has multiple user-facing states (loading, success, error), describe all of them.

---

## 2. The Problem This Feature Solves

Write 2–4 sentences answering: why does this feature exist? What specific problem does it solve? What would happen if this feature did not exist — would the app break, would users be blocked, or would the experience be degraded? Be concrete, not generic. Do not write things like "this improves user experience." Explain specifically what breaks or becomes impossible without it.

---

## 3. Technical Flow

This section must be written as a step-by-step narrative of exactly what happens in the system from the moment the user acts to the moment they see a result. Every step must be grounded in the actual code — reference real function names, real endpoint paths, real variable names, real table names where they aid understanding. Write each sub-section as flowing prose, not bullet points. Minimum 3 sentences per sub-section.

**Trigger:**
What exact user action starts this feature? Describe the UI element and what event it fires. If there are preconditions (user must be logged in, a previous step must be complete), state them explicitly.

**Frontend — What Happens on the Screen:**
Describe what the UI does immediately when the trigger fires. Does a loading state appear? Is the input disabled? What data is collected and how is it validated before being sent? What is the exact API endpoint path and HTTP method used?

**Backend — What the Server Does:**
What middleware runs first? What is the core logic — what does the server compute, check, or process? Are any external services called? What could cause the server to reject the request and return an error?

**Database — What Gets Stored or Retrieved:**
State explicitly whether this feature reads, writes, updates, or deletes data — or a combination. Name the actual tables or collections involved. Describe each query in plain English in the order they run. If no database interaction occurs, explicitly state that.

**Response — What Comes Back and What Happens Next:**
What does the server send back on success? What does the frontend do with that response — update state, redirect the user, show a message, store something locally? Walk through the complete path from server response to what the user finally sees.

---

## 4. Tech Used and Why

One row per technology directly involved in this feature. Do not list technologies in the project that are not used by this specific feature.

| Technology | What It Does in This Feature | Why This Specific Choice |
|---|---|---|
| [Name] | [Exactly what role it plays — specific to this feature] | [The actual reason chosen over alternatives. If default choice, explain why default is appropriate here. Never write generic reasons like "it's popular."] |

Minimum 3 rows. If you genuinely do not know why a technology was chosen, write "Default choice — no explicit alternative was evaluated" rather than fabricating a reason.

---

## 5. Key Decisions and Why

Identify every non-obvious implementation decision made in this feature. A decision is non-obvious if a reasonable developer could have done it differently. Look for: data structure choices, where validation happens (client vs server), what gets stored vs computed, sync vs async behavior, error handling strategy, state management approach.

Minimum 2 decisions. For each use this exact format:

**Decision:** [What was decided — one sentence]
- **Why:** [The reason — specific to this codebase and feature, not generic]
- **Alternative considered:** [What the other reasonable option was]
- **Why alternative was rejected:** [Specific reason. If never formally considered, write "Not explicitly evaluated — this was the default approach."]
- **Tradeoff accepted:** [What downside comes with the chosen approach. Do not write "no tradeoff." Every decision has one. Find it.]

---

## 6. Edge Cases and Known Limitations

For every edge case, state: what the condition is, whether the code handles it, and exactly what happens (not just "shows an error" — what error, where, what can the user do next).

Document all of the following mandatory edge cases plus any additional ones specific to this feature:

- **Empty or missing input:** [Condition] → [Current behavior]
- **Invalid format:** [Condition] → [Current behavior]
- **Duplicate submission:** [Condition] → [Current behavior]
- **Unauthorized access:** [Condition] → [Current behavior]
- **Network failure:** [Condition] → [Current behavior]
- **Slow response:** [Condition] → [Current behavior]
- **Concurrent modification:** [Condition] → [Current behavior]
- **Data not found:** [Condition] → [Current behavior]

After edge cases, list known limitations — things this feature intentionally or unintentionally does not support yet. Be honest. Do not omit gaps because they are embarrassing.

---

## 7. How to Explain This Feature

Write three fully written explanations. These are not templates or placeholders — write the actual explanation in full as if you were the developer speaking out loud. Do not write shortened versions of each other.

### To an Interviewer (Technical — They Are Judging Your Depth)

Write 5–7 sentences in first person. Cover in order: (1) what the feature does at a high level, (2) frontend behavior and what gets sent to the server, (3) what the backend does including key logic, (4) the database interaction, (5) at least one technical decision and why it was made, (6) one thing you would improve or add next. Use real technical vocabulary: HTTP methods, endpoint paths, library names, design patterns.

### To a Tech Peer (They Know the Basics — They Want the Interesting Parts)

Write 4–5 sentences. Skip the standard flow entirely — they can read the code. Focus exclusively on: what was the hardest or most interesting problem, what decision was made that a peer might question, what the tradeoff was, and what you would do differently with more time. Be direct and opinionated.

### To a Client or Non-Technical Stakeholder (They Care About Outcomes Only)

Write 2–4 sentences maximum. Describe only what the user experiences and what value it provides. Zero technical terms — no API, database, server, token, state, or request. If you use a technical word, replace it with plain English before finishing.

---

## 8. Hard Questions and Counters

Generate exactly 6 questions — the hardest, most probing questions that an interviewer, skeptical peer, or curious client would ask specifically about THIS feature. Base them on the actual implementation: what choices could be challenged, what limitations exist, what could go wrong.

For each, write an honest and complete answer. If there is a gap, acknowledge it directly and describe the proper solution. Do not bluff.

**Q: [Question]**
A: [Answer — minimum 3 sentences. Cover: what the current situation is, why it is the way it is, and what the ideal or next-step solution would be.]

---

*Last updated: [Today's date in DD/MM/YYYY]*

---

## Step 4: Update or Create the Project Overview File

After creating the feature file, handle docs/PROJECT_OVERVIEW.md as follows:

IF THE FILE DOES NOT EXIST: Create it. Infer content from the codebase by reading package.json, any README, source files, and folder structure. Do not leave placeholders for anything you have enough information to fill. Only use placeholders for things genuinely not determinable from the code.

IF THE FILE ALREADY EXISTS: Do not rewrite it. Do not change any existing content. The only permitted change is appending a new row to the Features Built table.

Features Built table format — append one row per /document invocation, never delete existing rows:

| # | Feature Name | Status | Date Completed | File |
|---|---|---|---|---|
| [n] | [Name] | Complete | [DD/MM/YYYY] | [Relative path] |

If creating PROJECT_OVERVIEW.md fresh, use this full structure:

---

# Project Overview: [Project name from package.json or folder name]

> **Last Updated:** [Today's date]
> **Stack:** [All major technologies]
> **Status:** In Development

## What This App Does
[3–5 sentences. What problem does it solve? Who uses it? What is the core experience? Infer from route names, component names, model names, README.]

## The Tech Stack and Why
| Layer | Technology | Why |
|---|---|---|
| Frontend | [Tech] | [Reason] |
| Backend | [Tech] | [Reason] |
| Database | [Tech] | [Reason] |
| Hosting | [Tech or "Not yet configured"] | [Reason] |
| Authentication | [Tech or "Not implemented"] | [Reason] |

## How the App Is Structured
[4–6 sentences. How does the frontend communicate with the backend? What is the general pattern — REST API, server-rendered, real-time? How is the database organized? Where does auth fit?]

## Features Built
| # | Feature Name | Status | Date Completed | File |
|---|---|---|---|---|

## Key Project-Level Decisions
[Minimum 2 decisions that affect the whole project. Same format as feature-level decisions: what was decided, why, alternative, why rejected, tradeoff accepted.]

## Known Gaps and Limitations
[Honest list of what is not built, not working, or incomplete at the project level. Do not leave blank.]

## How to Explain the Whole Project

### To an Interviewer
[5–7 sentences: what the app does, the architecture and why, one interesting decision, what you would build next.]

### To a Tech Peer
[4–5 sentences: architecture decisions and tradeoffs. What would you do differently?]

### To a Client
[2–3 sentences. Plain English only.]

## Top-Level Hard Questions

**Q: Why did you choose this tech stack over alternatives?**
A: [Specific answer based on actual stack]

**Q: How does the frontend communicate with the backend?**
A: [Explain the API pattern accurately but plainly]

**Q: How do you handle authentication and ensure users only see their own data?**
A: [Describe the actual auth implementation]

**Q: What happens if the server goes down or the database becomes unavailable?**
A: [Describe current error handling and its limitations honestly]

**Q: How would this app handle 10x more users?**
A: [What breaks first, what the scaling path is]

**Q: What would you build or fix next with more time?**
A: [Specific answer based on known codebase gaps]

---

## Step 5: Reply to the User

Reply with exactly this — no filler, no congratulations:

1. File created: [Full relative path to the feature file]
2. Overview updated: [Confirm what changed in PROJECT_OVERVIEW.md]
3. Summary: One paragraph in plain English describing what the feature does and how it works.
4. Gaps flagged: List every section where you had insufficient information, and exactly what the user should manually add. If none, write "No gaps — all sections filled from code."
5. Files read: List every file read to produce this documentation.

---

## Absolute Rules — Never Violate These

- Never fabricate behavior that does not exist in the code.
- Never write placeholder text in the feature file — either write real content or explicitly state what is missing and why.
- Never document a feature without reading the actual code first.
- Never skip Section 8 Hard Questions — it is the most valuable section.
- Never write a generic "Why" in the tech table — every reason must be specific to this feature.
- Never merge two sections even if they seem related.
- Never use bullet points inside the Technical Flow section — prose only.
- Never write "no tradeoff" for any decision — every decision has one, find it.
- Never leave the three audience explanations as templates — write them fully.
- If uncertain about any detail, say so explicitly rather than guessing.
