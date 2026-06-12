# Agent environments

Isolated runtimes for AI agents and autonomous workflows. Let them break things in a room with hard walls.

When you give an agent a shell, a browser, or a credit card, you want to know exactly what it can touch. Fibe agent environments are real Docker stacks with deliberate, auditable boundaries: the agent gets the network, the tools, and the secrets you decide on — nothing else.

## What it looks like

- A spec describing what the agent is allowed to read, write, and call
- Per-run snapshots: every action recorded, every artifact stored
- Hard network egress rules — no surprise calls to `api.evil.com`
- Reproducible: the same prompt + the same seed + the same environment → the same result

## Why "real environments" matters

Most AI demos run the agent against a stub. Real agents touch real systems, and the difference between "1 minute on stage" and "10 minutes on customer data" is where things break. Fibe lets you graduate an agent from sandbox to staging to production with the same boundaries definition, not three different ones.

## When to pick it

- You're shipping agents that do real work on real data
- You're a research lab running thousands of agent rollouts a day
- You need an audit trail an auditor will accept
- You want the agent to be allowed to fail without dragging production down
