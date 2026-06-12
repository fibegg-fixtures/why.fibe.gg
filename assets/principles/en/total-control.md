# Total control

Fibe is designed so the only third party in your stack is *you choosing one*. There is no part of the system that requires Fibe-the-company to ever see your code, your data, your models, or your customers.

## Three ways to run it

- **Fully managed** — sign in, pick a region, ship. Fibe runs the servers, handles routing, certificates, backups. You never read an Ops Slack channel again.
- **Fully self-hosted** — install the same Fibe binary on your laptop, your home server, or any box you own. Wire in your own GPU for a local model. Now nobody on the internet — including Fibe — has a path into your environments unless *you* open one.
- **Hybrid** — any combination. Our web app talking to your hardware. Your web app on our hardware. Your data, our compute. The split is *your* call, not a tier-based feature gate.

## What "third party" means here

When a builder picks an editor + model + cloud + auth provider today, they're usually wiring in four to seven companies, each with their own outage history, their own data-handling story, their own price hike incoming.

Fibe collapses that into **at most one** — and even that one is opt-in. You can:

- run code on **your hardware** instead of cloud,
- run AI on a **local model** instead of a hosted one,
- store data on **your storage** instead of managed,
- authenticate against **your IdP** instead of ours.

When you do all four, Fibe-the-company has zero visibility into your work. The product still does everything it does.

## Why this matters

- **Sovereignty** — if you're in finance, healthcare, defence, EU public sector, or you just don't trust anyone, you can run the whole platform inside your own walls.
- **Continuity** — if Fibe-the-company disappears tomorrow, your environments keep running. The binary is yours.
- **Cost shape** — when your bill is "the electricity that home server uses", scaling stops being scary.

> The default is convenience. The escape hatch is real.
