'use client';

import { useMemo, useState } from 'react';

type Theme = { theme: string; exampleQuote: string };
type Response = { reviewIndex: number; draftResponse: string; tone: 'apologetic' | 'grateful' | 'neutral' };
type Report = {
  positiveThemes: Theme[];
  negativeThemes: Theme[];
  recommendedActions: string[];
  reviewResponses: Response[];
  socialPosts: string[];
  faqSuggestions: string[];
  testimonials: string[];
  loveSummary: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [reviews, setReviews] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const count = useMemo(() => reviews.split('\n').filter((r) => r.trim()).length, [reviews]);

  async function generate() {
    setError('');
    setReport(null);
    const reviewList = reviews.split('\n').map((r) => r.trim()).filter(Boolean);
    if (!reviewList.length) return setError('Enter at least one review.');
    if (reviewList.length > 10) return setError('Maximum 10 reviews allowed.');

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 print:bg-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mb-3 inline-flex rounded-full border bg-white px-3 py-1 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">AI Reputation Manager</div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Turn customer reviews into a business action plan.</h1>
          <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">Paste up to 10 reviews. Get themes, operational recommendations, response drafts, content ideas, FAQs, and testimonial-ready copy.</p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between gap-4">
            <label htmlFor="reviews" className="font-semibold">Customer reviews</label>
            <span className="text-xs text-zinc-500">{count}/10 reviews</span>
          </div>
          <textarea
            id="reviews"
            value={reviews}
            onChange={(e) => setReviews(e.target.value)}
            placeholder={'Great service and friendly staff.\nThe wait was too long, but the food was excellent.\n...'}
            className="min-h-64 w-full resize-y rounded-xl border border-zinc-300 bg-white p-4 text-sm outline-none ring-0 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-300"
          />
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="mt-4 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? 'Analyzing reviews...' : 'Generate reputation report'}
          </button>
        </section>

        {report && (
          <div className="mt-8 space-y-5 print:mt-4">
            <div className="flex items-center justify-between gap-4 print:hidden">
              <h2 className="text-2xl font-bold">Reputation Report</h2>
              <button type="button" onClick={() => window.print()} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Print / Save PDF</button>
            </div>

            <Section title="What customers love">
              <p className="leading-7 text-zinc-700 dark:text-zinc-300">{report.loveSummary}</p>
            </Section>

            <div className="grid gap-5 md:grid-cols-2">
              <Section title="Positive themes">
                <div className="space-y-3">{report.positiveThemes?.map((t, i) => <div key={i} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950"><strong>{t.theme}</strong><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">“{t.exampleQuote}”</p></div>)}</div>
              </Section>
              <Section title="Negative themes">
                <div className="space-y-3">{report.negativeThemes?.map((t, i) => <div key={i} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950"><strong>{t.theme}</strong><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">“{t.exampleQuote}”</p></div>)}</div>
              </Section>
            </div>

            <Section title="Recommended operational actions"><ul className="list-disc space-y-2 pl-5">{report.recommendedActions?.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>

            <Section title="Review response drafts">
              <div className="space-y-3">{report.reviewResponses?.map((r, i) => <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Review #{r.reviewIndex} · {r.tone}</span><CopyButton text={r.draftResponse} /></div><p className="text-sm leading-6">{r.draftResponse}</p></div>)}</div>
            </Section>

            <div className="grid gap-5 md:grid-cols-2">
              <Section title="Social media post ideas"><div className="space-y-3">{report.socialPosts?.map((p, i) => <div key={i} className="flex gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950"><p className="flex-1 text-sm">{p}</p><CopyButton text={p} /></div>)}</div></Section>
              <Section title="FAQ suggestions"><ul className="list-disc space-y-2 pl-5 text-sm">{report.faqSuggestions?.map((f, i) => <li key={i}>{f}</li>)}</ul></Section>
            </div>

            <Section title="Polished testimonials"><div className="space-y-3">{report.testimonials?.map((t, i) => <div key={i} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950"><p className="flex-1 text-sm italic">“{t}”</p><CopyButton text={t} /></div>)}</div></Section>
          </div>
        )}
      </div>
    </main>
  );
}
