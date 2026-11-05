# Incremental Angular upgrade (required path)

Direct jumps across many major versions are not supported by Angular's migration schematics. This repo was on **Angular 10** with **Nebular 6**.

## Constraints discovered
- **Nebular 17** (current) peers with **Angular ^21**. Nebular 6 peers with old Angular. Nebular and `@angular/cdk` must be upgraded in compatible steps (notably around Angular 20/21 for Nebular 17).
- **`@angular/fire` 6 / `firebase` 7-8** were present but unused in source; remove during upgrade to avoid peer conflicts (Firebase Hosting config remains).
- **Node**: modern Angular/CLI requires Node >= 18.19/20.11/20.19 depending on version; this environment has Node 24.x.
- **TSLint/Protractor** are legacy; migrate to ESLint/alternative test tooling where practical.

## Stepwise plan (commit after each green step)
1. **Baseline (Angular 10):** `npm ci` (or `npm install` with restored lockfile), fix install, ensure `ng build`/tests run as-is where feasible.
2. **10 → 11:** `npx @angular/cli@11 update @angular/core@11 @angular/cli@11 --force --allow-dirty`; align Nebular/CDK to 11-compatible releases if available; `npm install`; `ng build`.
3. **11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19:** repeat `ng update` per major; resolve TS/webpack/karma/template migrations; keep Nebular/CDK compatible (Nebular may require jumping to a matching major when available).
4. **19/20 boundary:** address standalone/control-flow migrations as needed (can keep NgModule app), update builders.
5. **20 → 21:** move Nebular to `^17`, `@angular/cdk` to `^21`, RxJS/zone/TS to versions required by Angular 21; migrate to application builder and modern tsconfig; update Firebase `public` to `dist/ng-tic-tac-toe/browser`.
6. **Validation each step:** `npm run build` and targeted tests; fix compilation/runtime issues before next major.
7. **Firebase deploy:** `npm run build && npx firebase-tools deploy --only hosting:ng-tic-tac-toe` (requires auth/project access).

## Automation helper
`/tmp/ng-upgrade-incremental.sh` contains a draft loop — **review before use**; Nebular peer constraints mean some steps need manual dependency alignment and code fixes.
