## Agent skills

### Specifications and Contracts

Specifications and contracts are tracked in:
- Frontend specs: `FE/docs/specs/admin-spec.md`, `FE/docs/specs/instructor-spec.md`, `FE/docs/specs/student-spec.md`
- API Contracts: `FE/docs/api-contracts.md`
- Database schema: `BE/docs/database/`

### Triage labels

Canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context domain documentation (`GLOSSARY.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.

### Environment & Shell Guidance (Windows)

- Shell is Windows PowerShell.
- Use PowerShell cmdlets (`Select-String`, `Get-ChildItem`) or Node.js scripts instead of Unix utilities (`grep`, `head`).
- Unit testing: `npm run test:unit` in `FE/` (Vitest, sub-second).
- End-to-end testing: `npx playwright test` in `FE/` (Playwright).
- Verification pipeline: `npm run verify` in `FE/` (checks linter, types, comments, minimalist UI, and unit tests).
