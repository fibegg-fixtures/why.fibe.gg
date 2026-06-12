# Staging & UAT

A near-identical copy of your production — as many times as you need, at a fraction of what AWS charges for the same.

If you run infrastructure at a company, you know the dance. Production is on AWS, costs $50k a month, and the *staging* environment costs another $30k. Then QA asks for a copy. Then product wants one for a demo. Then a customer asks for their own UAT environment. Each one is two weeks of Terraform and a budget conversation.

Fibe collapses that. Your production setup is a `docker-compose.yml` (or a thin wrapper around one). Fibe spins it up as a fresh, isolated environment — same services, same wiring, same shape. As many copies as you need. On a single Fibe server you can pay for in a week of the AWS staging bill.

## What you get

- **Identical to production** — your real images, your real config, your real services
- **Self-contained, when you want it** — pure docker-compose, no cloud dependencies. Perfect for QA-on-laptop, an air-gapped customer demo, or just sleeping at night.
- **Hybrid, when you need it** — keep SQS, S3, RDS (or any managed service) wired to your real cloud account. Spin only the *application* in Fibe. Staging hits the same managed pieces as prod — just on your own copy of the app.
- **As many as you want** — five staging copies? Twenty? Whatever your QA and product teams actually need, without finance asking why.
- **Disposable** — `fibe down`, gone. No leftover EBS volumes billing you for weeks.

## When this is for you

- You run infra or DevOps at a real company and the non-production AWS bill is **bigger than production**
- Your QA team is queuing for "the staging environment" because there's only one
- Product wants previews, customers want UAT, security wants a pentest copy — and you can't say yes to all of them at AWS prices
- You're tired of "it worked in dev" because dev and staging don't actually look like prod

## Cost shape

A typical Fibe server runs a dozen full-stack staging environments at once, for the cost of a single `t3.xlarge` running 24/7 on AWS. Pay per server, not per environment. The math gets uncomfortable for incumbents quickly.

> Non-production used to be where the money quietly burned. Now it's where it goes home.
