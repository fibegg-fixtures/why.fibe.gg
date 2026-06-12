# Flat fee per server

Software is one of the few industries where the standard price model gets *worse* the more value you extract from the product. Per-seat SaaS punishes you for inviting your team. We don't.

## How it works

- **You pick a server size.** Small, medium, large, beast — each is one flat monthly number.
- **That's the entire price.** No per-seat, no per-build, no per-environment, no per-deploy. The server bill is the bill.
- **Invite freely.** Add ten contributors or two thousand. Same monthly number.
- **Outgrew the tier?** Upgrade the box. New tier, new flat number, same shape.

## What this *doesn't* mean

It doesn't mean Fibe is "free" in a hand-wavy way. The server costs real money — same as Linode, Hetzner, AWS, your own colo rack. We just don't pile a multiplier on top of it that scales with your team.

## The accounting story

Most teams discover, six months into a SaaS deployment, that their bill went from "manageable" to "we need to renegotiate the contract before the board call". That happens for two reasons:

1. **Per-seat creep** — every new hire, every contractor, every read-only viewer adds a line.
2. **Usage spikes** — one feature launch, one viral moment, one CI run gone wrong, and the monthly bill triples.

Flat-per-server kills both. You scale **vertically** (bigger server) when you need to, on a step-function curve you control — not a smooth-but-unstoppable monthly slope.

## Pricing examples

(Placeholder — the actual tiers live at [fibe.gg/pricing](https://fibe.gg/). Here's the shape.)

- **Hobby** — $X / month. Small server, a few concurrent environments. Your weekend hacks.
- **Team** — $Y / month. Medium server, dozens of concurrent environments. Your startup.
- **Studio** — $Z / month. Large server, hundreds. A 50-person engineering team.
- **Self-hosted** — your hardware, your bill. We charge zero.

Same flat shape at every tier. Same lack of seat math at every tier.
