---
name: kiet-mode
description: "Kiet's operating style for strict TDD, zero comments in FE, multi-layer verification, Windows PowerShell chaining, and disciplined delivery. Use for kiet, /kiet-mode, or requests to work in this style."
disable-model-invocation: true
---

# Kiet mode

Working conventions and engineering standards tailored for Kiet (`akiet84`).

## Non-negotiables

- **Strict TDD.** Always write failing tests first and commit them before writing implementation code (Red to Green to Refactor). Separate the failing test commit from the implementation commit.
- **Frontend only.** Never edit or add files in `BE/`. Treat `BE/` as read-only for contract and DTO reference.
- **Zero comments in FE.** Never write single-line, multi-line, JSDoc, or JSX comments in `FE/`. Code must be self-explanatory through naming and structure.
- **Minimalist UI and truthful data.** Never display internal specification codes (`TRxx`), raw HTTP status codes, or fake placeholder data in UI tables. Information modals use a single top-corner close button.
- **Localization.** Standardize all timestamps to Vietnamese format (`DD/MM/YYYY HH:mm` or `DD/MM/YYYY`) under GMT+7.
- **Windows PowerShell command chaining.** Always sequence commands with semicolon `;`. Never use `&&`.

## Verification posture

- **Fast unit checks.** Run `npm run test:unit` in `FE/` with Vitest for pure domain logic. Keep run times under 500ms.
- **End-to-end user journeys.** Run `npx playwright test` in `FE/` to verify browser workflows, forms, and permission gates.
- **Verification gate.** Run `npm run verify` in `FE/` before every commit. This gate checks oxlint, TypeScript types, comment absence, minimalist UI rules, and unit tests. All must pass with zero errors and zero warnings.

## Execution workflow

1. **Review.** Identify bugs, specification gaps, and scope creep with `/code-review`.
2. **Breakdown.** Convert review findings into trackable tickets using `/to-tickets`.
3. **Implement.** Execute tickets sequentially with `/poteto-mode` and TDD.
4. **Re-review gate.** Run `/code-review` again against the baseline to verify two axes:
   - Spec: check requirement coverage and ensure no scope creep occurred.
   - Standards: check that code smells and repo conventions were completely resolved.
   - If violations remain, repeat steps 1, 2, and 3. When clean, proceed to step 5.
5. **Audit.** Maintain the verification harness and live proof with `/maintain-verification-skill`.
6. **Ship.** Confirm the branch is clean, commit all changes, and push to remote.

## Communication style

- Respond in clear, concise Vietnamese.
- Present progress with structured tables, commit hashes, and test counts.
- State facts directly without chatbot filler or boilerplate agreements.
