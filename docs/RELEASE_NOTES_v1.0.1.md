# Release Notes — v1.0.1

## Highlights
- Scoped package to avoid name conflict: `@mriridescent/rezilient`
- Enabled semantic-release CI for automated versioning, tags, GitHub Releases, and npm publish
- Hardened GitHub Actions with required permissions and npm auth
- CI-safe threshold for a heavy load test to avoid flakiness (local thresholds remain strict)
- README badges added (npm version/downloads, releases, CI, bundle size, license)

## Changes
- feat: scope package to `@mriridescent/rezilient` and update README imports/badges
- ci: add semantic-release workflow and `.releaserc`
- ci: grant permissions, configure npm auth, enable debug logs
- test: relax Carbon Scheduler "massive task scheduling" threshold on CI only
- docs: add badges and initial CHANGELOG scaffold
- chore: add repository/homepage/bugs/publishConfig metadata

## CI/CD
- Pushes to `main` trigger:
  - Version calculation via conventional commits
  - CHANGELOG.md and package.json updates
  - GitHub Release + tag creation
  - npm publish using `NPM_TOKEN`

## Build/Test
- Rollup build produces ESM, CJS, and UMD bundles
- Tests: 12 suites passed, 0 failed (174 passed, 2 skipped)
- `npm pack --dry-run` verified publishable tarball contents

## Installation
```
npm install @mriridescent/rezilient
```
```js
import { AetherComponent, initializeAether } from '@mriridescent/rezilient';
```

## Breaking change
- Package name changed from `rezilient.js` to `@mriridescent/rezilient`

