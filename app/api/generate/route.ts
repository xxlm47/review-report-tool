import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const reviews = body?.reviews;

    if (!Array.isArray(reviews) || reviews.length < 1 || reviews.length > 10) {
      return NextResponse.json({ error: 'Please provide between 1 and 10 reviews.' }, { status: 400 });
    }

    const cleaned = reviews
      .filter((review): review is string => typeof review === 'string')
      .map((review) => review.trim())
      .filter(Boolean);

    if (cleaned.length < 1 || cleaned.length > 10) {
      return NextResponse.json({ error: 'Please provide between 1 and 10 non-empty reviews.' }, { status: 400 });
    }

    const prompt = `You are an expert local-business reputation manager. Analyze these ${cleaned.length} customer reviews and produce a practical reputation report.

REVIEWS:
${cleaned.map((review, i) => `${i + 1}. ${JSON.stringify(review)}`).join('\n')}

Return ONLY valid JSON matching this exact structure:
{
  "positiveThemes": [{"theme": "string", "exampleQuote": "string"}],
  "negativeThemes": [{"theme": "string", "exampleQuote": "string"}],
  "recommendedActions": ["string"],
  "reviewResponses": [{"reviewIndex": 1, "draftResponse": "string", "tone": "apologetic|grateful|neutral"}],
  "socialPosts": ["string"],
  "faqSuggestions": ["string"],
  "testimonials": ["string"],
  "loveSummary": "string"
}

Rules:
- Ground every claim in the supplied reviews.
- Do not invent customer experiences, facts, statistics, or business policies.
- Keep responses professional, human, concise, and appropriate for public review sites.
- Preserve reviewIndex so each supplied review gets one response.
- Testimonials must be polished versions of ideas actually present in the reviews; do not fabricate praise.
- Return no markdown or explanation outside the JSON object.`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'The AI returned an empty response.' }, { status: 502 });
    }

    const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let report: unknown;

    try {
      report = JSON.parse(clean);
    } catch {
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start === -1 || end <= start) throw new Error('Invalid JSON response');
      report = JSON.parse(clean.slice(start, end + 1));
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Failed to generate the report. Please try again.' }, { status: 500 });
  }
}
