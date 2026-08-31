# AI Reputation Manager

A stateless Next.js MVP that turns up to 10 customer reviews into an actionable local-business reputation report using Groq.

## Features

- Positive and negative review themes
- Operational recommendations
- Draft response for every review
- Social-media post ideas
- FAQ suggestions
- Polished testimonial copy
- "What customers love" summary
- Copy buttons
- Print / Save as PDF
- No database

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- OpenAI SDK pointed at Groq's OpenAI-compatible API
- Vercel-ready

## Local setup

```bash
npm install
cp .env.local.example .env.local
```

Put your Groq API key in `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel deployment

Import this repository into Vercel and add `GROQ_API_KEY` under the project's Environment Variables. Do not commit `.env.local` or a real API key.

## Usage

Paste one customer review per line, up to 10 reviews total, then generate the report. The API key remains server-side and is never exposed to the browser.

## Notes

The MVP deliberately uses manual review input so the idea can be validated without Google Business Profile integrations, scraping, authentication, or a database. Future versions can add business workspaces, review imports, saved reports, branded PDF exports, and billing.
