Quickstart (install, dev, build, test)

Tech stack (Next.js, Node, package manager)

Environments & secrets (what, where)

CI/CD overview (what checks run, how deploy happens)## CI/CD

- **CI** runs on every push/PR: lint, typecheck, tests, Next.js build.
- **Docs checks** run in parallel (markdown style, spelling, links).
- **Preview**: every PR deploys a preview on Vercel (link in the PR checks).
- **Prod**: merging to `main` deploys to Production on Vercel.
- **Secrets**: stored in Vercel (Preview/Prod) and GitHub Actions (if used).
## CI smoke test 2025-08-24T16:01:33
This line exists only to trigger CI.
