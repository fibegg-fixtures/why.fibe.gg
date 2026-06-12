# Build & test in CI

A full production-shape environment, spun up inside a CI job — with the real test-data dump loaded — just to run your E2E suite. Gone before the job exits.

If you've ever tried to run real end-to-end tests on a shared "staging" or "beta", you know the story. Someone else's test data is sitting in the database. A flaky service is mid-deploy. The queue is full from yesterday's run. Your test fails for reasons that have nothing to do with your code. Then you fight for a slot, rerun, and pray. Then someone asks "did you remember to seed the DB?"

Fibe makes the environment part of the test run. Inside a single CI job, Fibe spins up the whole stack — every service, every queue, the full database seeded from your real test-data dump — runs your E2E suite against it, and tears the environment down when the job exits. No queue. No contamination. No "but it worked on staging last week".

## What you get

- **Full production-shape stack, per CI job** — same services, wired the same way, just transient
- **Real test database** — seeded from your dump, your sanitized prod snapshot, or a fixture pinned per suite. Not "a fresh empty Postgres".
- **Spins up in seconds** — Fibe keeps the images warm so the job doesn't pay the cold-boot cost
- **Branch and build isolation** — every CI run gets its own copy. Two PRs touching the same service don't fight over one queue.
- **Zero leftover** — when the job exits, the environment is gone. No EBS volumes humming on your bill. No "did anyone clean up env-237?" thread on Monday.

## When this is for you

- You run release engineering, SRE, or QA automation, and "did the build pass on staging?" is a daily lottery
- Your team has a real E2E suite that needs a real environment — actual queues, actual DB, actual auth service
- Flaky CI failures on a static staging eat hours of debugging that wasn't a code problem
- You want to gate every merge on E2E passing, but you can't queue 30 PRs through one shared environment

## How it slots in

One line in your `.github/workflows/*.yml` (or GitLab CI, CircleCI, Buildkite, whatever you run):

```yaml
- run: fibe up
- run: npm run test:e2e
- run: fibe down  # also runs automatically on job timeout / cancel
```

The Fibe environment is a CI service the way Postgres or Redis is — except it's the *whole stack*, not a single service. Same secrets management, same image registry, same network primitives your existing CI already understands.

> If your green check on a PR only proves the code compiles, you don't have CI. You have a build server.
