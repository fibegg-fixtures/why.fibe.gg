# Run it locally first

Fibe is a thin, opinionated wrapper around the world's most-deployed orchestration tool: **Docker Compose**. Your source of truth is a plain `docker-compose.yml`. Nothing more, nothing custom, nothing proprietary.

That single fact unlocks a way of working that other platforms can't quite imitate.

## What "thin wrapper" actually means

- **No platform-specific YAML.** No `fibe.yml`, no special build manifest, no DSL to learn. The file you'd write to run a service on your laptop is the same file Fibe reads.
- **No translation layer.** Fibe doesn't compile your compose file into something else. It runs it. The same `docker compose up` you'd type in a terminal is what happens inside.
- **No vendor lock-in.** If Fibe disappears tomorrow, your repo still works. Anyone with a laptop and Docker can stand up the same stack.

## Local → CI → production

The killer use case is **CI/CD verification before deploy**. Most "deploy your stack" platforms make you push a change, watch it break in their pipeline, push another change, watch *that* break, repeat for an hour.

With Fibe:

1. **Edit `docker-compose.yml` on your laptop.**
2. **Run it locally.** `docker compose up` — exactly what Fibe would do.
3. **Iterate until your services come up, your health checks pass, your tests are green.** All on your machine. Zero round-trips to a remote system.
4. **Only then push to Fibe.** What worked locally works there. Same compose file, same images, same networking shape.

The cycle that used to take 30 minutes (push → wait → fail → fix → push → wait …) takes about 30 seconds (`docker compose up` → fix → `docker compose up`).

## What "deterministic" buys you

- **Reproducible bug reports** — "it works on my machine" stops being a meme. Your machine and Fibe both run the same compose graph against the same images.
- **Real offline development** — get on a plane, work on the full stack without a network, push when you land. Nothing in the platform requires connectivity to function.
- **Air-gapped deploys** — a customer with no internet can run your product. You hand them the compose file, the images, and the platform — they run it on their hardware, same as you.
- **Migration safety** — moving between Fibe servers, between regions, between Fibe and self-hosted: the same compose file. No "migration script" to write.

## What we add on top

The wrapper part is the value-add:

- **Public URLs for every service** — Fibe handles routing, certificates, DNS so you don't sprinkle ngrok across your compose file.
- **One-click environment cloning** — make a copy of a running stack for a teammate, an experiment, a customer demo.
- **AI integration points** — agents can read/write the compose file, exec commands inside the running stack, capture artifacts. (Optional, off by default.)
- **Web UI for the running stack** — logs, terminal, file browser, env-var editor. Same things you'd want on production, accessible from a browser.

None of these change how the underlying compose runs. They sit *around* it.

## The single sentence

> **Whatever runs locally with `docker compose up` runs on Fibe. Whatever runs on Fibe runs locally with `docker compose up`. There is no other contract.**

That's the boring promise. It's the one that makes the system stable enough to bet a company on.
