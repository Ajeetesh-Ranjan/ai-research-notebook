# CiteMind Monetization Plan

> **Strategy:** Free for 3 months → Paid tiers based on download milestones.

---

## Overview

| Phase | Timing | Price | Goal |
|---|---|---|---|
| Launch (Free) | Months 0–3 | $0 | Acquire users, gather feedback, build community |
| Early Adopter | Months 4–6 | $8/mo | Convert engaged users, validate willingness to pay |
| Growth | Months 7–12 | $12/mo | Scale revenue, add team/enterprise tiers |
| Maturity | Year 2+ | $12–39/mo | Full tiered model with enterprise custom pricing |

---

## Free Trial (0–3 Months)

**Why free first?**
- Remove friction for researchers, students, and academics
- Build a user base for network effects (collaboration, shared graphs)
- Collect real usage data to refine AI models and UX
- Generate reviews and word-of-mouth before paywall

**Free tier includes:**
- 3 projects
- 50 documents
- 500 MB storage
- 50 AI queries/month
- Basic PDF annotations and highlights
- Knowledge graph (up to 100 nodes)
- Export to Markdown only
- Community support

**Free tier limits (hard gates after trial):**
- No multi-document AI reasoning
- No team collaboration
- No DOCX/PPTX export
- No Notion sync
- Watermarked exports

---

## Pricing Tiers (Post-Trial)

### Pro — $12/month (or $99/year, save 31%)

**Target:** Individual researchers, grad students, consultants, analysts

- Unlimited projects
- Unlimited documents
- 20 GB storage
- Unlimited AI queries
- All export formats (DOCX, PPTX, PDF, HTML, MD)
- Notion sync
- Advanced knowledge graph
- Priority AI model (GPT-4o)
- Email support

### Team — $39/user/month (or $349/user/year)

**Target:** Research labs, consulting teams, law firms, product teams

- Everything in Pro
- Shared team workspaces
- Real-time collaboration on annotations
- Team knowledge graphs
- Admin dashboard with usage analytics
- Role-based access (Owner, Editor, Viewer)
- SSO (Google Workspace, Microsoft 365)
- Shared citation libraries
- Priority support (24h response)

### Enterprise — Custom pricing

**Target:** Universities, enterprises, government, pharma

- Everything in Team
- Unlimited storage
- Custom AI model fine-tuning
- On-premise or private-cloud deployment
- SOC 2 Type II / HIPAA compliance
- Dedicated account manager
- SLA with 99.9% uptime
- Custom integrations (Salesforce, SharePoint, etc.)
- White-label options

---

## Download Milestone Pricing Adjustments

| Milestone | Action |
|---|---|
| 1,000 downloads | Keep free trial extended; add referral bonuses |
| 5,000 downloads | Introduce Pro at $8/mo (early-bird discount) |
| 10,000 downloads | Raise Pro to $12/mo; launch Team tier at $29/mo |
| 25,000 downloads | Launch Enterprise tier; add annual plans with 2 months free |
| 50,000 downloads | Introduce student/academic discount (50% off Pro) |
| 100,000 downloads | Add lifetime deal option ($299 one-time) |
| 250,000+ downloads | Consider freemium ad-supported tier for casual users |

---

## Payment Infrastructure

### Stripe Integration

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   CiteMind App  │────▶│  Stripe SDK  │────▶│  Stripe API     │
│  (Checkout UI)  │     │ (Elements)   │     │ (Subscriptions) │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                              │
         │                                              ▼
         │                                       ┌──────────────┐
         │                                       │  Webhooks    │
         └───────────────────────────────────────│  (sync plan  │
                                                 │   status)    │
                                                 └──────────────┘
```

**Stripe products setup:**
- Product: `CiteMind Pro Monthly` — Price: $12/mo
- Product: `CiteMind Pro Yearly` — Price: $99/yr
- Product: `CiteMind Team Monthly` — Price: $39/user/mo
- Product: `CiteMind Team Yearly` — Price: $349/user/yr

**Webhook events handled:**
- `customer.subscription.created` → Activate Pro/Team features
- `customer.subscription.updated` → Sync plan changes
- `customer.subscription.deleted` → Downgrade to free
- `invoice.payment_failed` → Grace period + email reminder

### Trial Implementation

```typescript
// Prisma schema extension
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  trialEndsAt   DateTime  @default(dbgenerated("NOW() + INTERVAL '3 months'"))
  plan          Plan      @default(FREE)
  stripeCustomerId String?
  stripeSubscriptionId String?
}

enum Plan {
  FREE
  PRO
  TEAM
  ENTERPRISE
}
```

**Trial enforcement middleware:**
- Check `trialEndsAt` on every authenticated request
- If expired and plan === FREE, return 402 Payment Required
- Show upgrade modal in frontend with countdown
- Email reminders at 7 days, 3 days, 1 day before expiry

---

## Revenue Projections (Conservative)

| Month | Free Users | Pro Users | Team Users | MRR |
|---|---:|---:|---:|---:|
| 1 | 500 | 0 | 0 | $0 |
| 3 | 2,000 | 0 | 0 | $0 |
| 6 | 3,000 | 150 | 5 | $1,995 |
| 9 | 4,500 | 400 | 20 | $5,580 |
| 12 | 6,000 | 800 | 50 | $11,550 |
| 18 | 8,000 | 1,500 | 120 | $22,680 |
| 24 | 10,000 | 2,500 | 250 | $39,750 |

**Assumptions:**
- 5% free-to-paid conversion at month 6
- 10% free-to-paid conversion at month 12
- 1% of paid users upgrade to Team
- Annual plans = 30% of paid users

---

## Promotional Tactics

| Tactic | Details |
|---|---|
| Student Discount | 50% off Pro with .edu email verification |
| Referral Program | 1 free month per successful referral |
| Annual Incentive | 2 months free when paying yearly |
| Team Trial | 14-day free Team trial for any Pro user |
| Volume Discount | 20% off for teams of 10+ users |
| Nonprofit Discount | 75% off for registered nonprofits |

---

## Competitor Pricing Reference

| Tool | Lowest Paid | Notes |
|---|---|---|
| LiquidText | $4.99/mo | iPad-only, no AI |
| Notion | $8/mo | General purpose, weak PDF/AI |
| Obsidian | $0 (sync $8/mo) | No native AI, plugins needed |
| NotebookLM | Free (Google) | No export, US-only |
| Elicit | $12/mo | AI-only, no PDF annotation |
| Readwise Reader | $7.99/mo | Reader-only, no graph |

**CiteMind positioning:** Best value at $12/mo for the only tool combining PDF annotation + AI reasoning + knowledge graph + professional export.
