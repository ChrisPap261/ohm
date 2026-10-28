# Bugs — OHM Next

Build under test: Playwright localStorage demo, 2026-10-28 (Europe/Bucharest)

### BUG-001: Chart containers used aria-hidden with focusable Recharts nodes

- Severity: S3
- Flow / case: A11Y-01
- Screen: S04
- Build: pre-fix  Browser / device: Chromium Playwright, 1280px

Steps
1. Register a user
2. Open dashboard
3. Run axe wcag2a/aa

Expected: no serious/critical axe violations  
Actual: `aria-hidden-focus` on bar/pie chart wrappers (`aria-hidden` + focusable SVG)  
Evidence: failing `A11Y-01 axe on dashboard after register`  
Suspected cause: decorative `aria-hidden` on parents that contain tabbable Recharts surfaces  
Status: fixed — removed `aria-hidden`, added `role="img"` + `aria-label` on chart panels

---

## To check (manual / Supabase)

- SEC-01: RLS isolation with a second Supabase user (needs project keys)
- F08-E1: full keyboard-only navigation of sidebar submenu
- Password-reset email delivery against a real Supabase project
- Offline / slow network behaviour
