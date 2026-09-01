# Instant Quote Auditor

A tiny, stateless web app for fence contractors that checks pasted estimates for common estimating risks before a customer quote is sent.

## MVP

Paste an estimate such as:

```text
240 LF 6' privacy fence
31 posts
2 gates
Labor $2,400
Materials $4,100
Total $6,500
```

The app extracts the basic takeoff and checks:

- Approximate post spacing
- Gate hardware omissions
- Material allowance risk
- Missing concrete allowance
- Missing labor/material/price fields
- Gross margin
- Suggested price range based on a target gross-margin band

It can also generate a simple customer-facing quote and use the browser print dialog to save the report as PDF.

## Important

This MVP uses transparent deterministic rules rather than an AI API. That makes the first validation version free to run and easy to audit. It is a planning aid, not a substitute for a contractor's actual takeoff, supplier pricing, site inspection, engineering, or local requirements.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- No database
- No authentication
- No paid API required

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product roadmap

1. Validate with fence contractors.
2. Add editable contractor assumptions (post spacing, concrete, waste, target margin).
3. Add saved estimate history.
4. Add account/billing only after users repeatedly request it.
5. Add specialized audit modes for roofing, concrete, landscaping, and painting.
