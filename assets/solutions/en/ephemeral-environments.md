# Ephemeral environments

An environment per branch or PR. Spins up on push, lives as long as it's useful, evaporates after.

A real, full-stack environment for every change you ship — created automatically, named after the branch, torn down when the PR closes. You stop arguing over "who has the staging server" and start sharing URLs instead.

## What it looks like

- Open a PR → a URL appears in the PR description in under a minute
- The environment has its own database, queues, and seeded data
- Auto-cleanup when the PR merges or goes stale for 7 days
- Cost-aware: idle environments scale to zero

## The shift it triggers

- **Reviewers click before they LGTM** — code review becomes product review
- **Designers iterate on the real thing** — no more "but in Figma it looked like…"
- **Customer support reproduces bugs** in a copy with the customer's seed data
- **Sales demos a feature** that isn't shipped yet without booking engineering

## When to pick it

If your team has more PRs open than staging slots, this is the shape that ends the queue.
