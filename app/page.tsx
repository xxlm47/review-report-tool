'use client';

import { useMemo, useState } from 'react';

type Issue = { severity: 'high' | 'medium' | 'low'; title: string; detail: string; fix: string };
type Audit = {
  lf: number | null;
  height: number | null;
  posts: number | null;
  gates: number | null;
  labor: number | null;
  materials: number | null;
  total: number | null;
  spacing: number | null;
  expectedPosts: number | null;
  materialRisk: 'Low' | 'Medium' | 'High';
  marginPct: number | null;
  recommendedLow: number | null;
  recommendedHigh: number | null;
  issues: Issue[];
};

const money = (n: number | null) => n == null ? '—' : `$${Math.round(n).toLocaleString()}`;

function parseNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/,/g, ''));
  }
  return null;
}

function auditEstimate(text: string): Audit {
  const lf = parseNumber(text, [/(\d[\d,]*)\s*(?:LF|linear\s*(?:feet|foot))/i]);
  const height = parseNumber(text, [/(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(?:privacy|fence|tall)?/i, /(?:height|tall)\s*[:=]?\s*(\d+(?:\.\d+)?)/i]);
  const posts = parseNumber(text, [/(\d[\d,]*)\s*(?:posts?|poles?)/i]);
  const gates = parseNumber(text, [/(\d[\d,]*)\s*gates?/i]);
  const labor = parseNumber(text, [/(?:labor|labour)\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i]);
  const materials = parseNumber(text, [/(?:materials?|material cost)\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i]);
  const total = parseNumber(text, [/(?:total|customer price|price)\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i]);

  const issues: Issue[] = [];
  const expectedPosts = lf ? Math.ceil(lf / 8) + 1 : null;
  const spacing = lf && posts ? lf / Math.max(posts - 1, 1) : null;

  if (lf && posts && spacing && (spacing > 8.5 || spacing < 5.5)) {
    issues.push({ severity: 'high', title: 'Possible post-spacing issue', detail: `${posts} posts across ${lf} LF implies about ${spacing.toFixed(1)} ft between posts.`, fix: `Verify layout and post spacing. A rough 8-ft planning check would be about ${expectedPosts} posts before accounting for gates, corners, ends, and site conditions.` });
  }

  if (gates && gates > 0) {
    issues.push({ severity: 'medium', title: 'Gate hardware may be missing', detail: `${gates} gate${gates === 1 ? '' : 's'} detected, but the pasted estimate does not identify hinges, latch, frame, wheels, or other gate hardware.`, fix: 'Confirm gate hardware, frames, hinges/latches, stops, and specialty hardware are included in materials.' });
  }

  if (lf && materials && height) {
    const materialPerLf = materials / lf;
    if (materialPerLf < 12) {
      issues.push({ severity: 'high', title: 'Material allowance looks low', detail: `${money(materials)} is about ${money(materialPerLf)} per LF for a ${height}-ft fence.`, fix: 'Recheck fabric/panels, posts, rails, fittings, concrete, gates, delivery, waste, and terrain allowances.' });
    } else if (materialPerLf < 18) {
      issues.push({ severity: 'medium', title: 'Material allowance deserves review', detail: `${money(materials)} is about ${money(materialPerLf)} per LF before gate and site-specific adjustments.`, fix: 'Verify takeoff quantities and current supplier pricing before sending the quote.' });
    }
  }

  if (lf && posts && height && gates && materials && materials < posts * 8 + gates * 100) {
    issues.push({ severity: 'medium', title: 'Concrete quantity may be underestimated', detail: 'The estimate includes posts but does not state a concrete quantity or allowance.', fix: 'Add an explicit concrete takeoff based on hole diameter/depth, post type, soil, and local practice.' });
  }

  if (!materials) issues.push({ severity: 'high', title: 'Materials cost not detected', detail: 'No materials dollar amount was found.', fix: 'Add the material cost or itemized takeoff so margin can be checked.' });
  if (!labor) issues.push({ severity: 'medium', title: 'Labor cost not detected', detail: 'No labor dollar amount was found.', fix: 'Add labor cost to evaluate job margin.' });
  if (!total) issues.push({ severity: 'medium', title: 'Customer price not detected', detail: 'No total/customer price was found.', fix: 'Add the proposed selling price to calculate margin and pricing guidance.' });

  const cost = (labor ?? 0) + (materials ?? 0);
  const marginPct = total && cost ? ((total - cost) / total) * 100 : null;
  const targetLow = cost ? cost / 0.78 : null;
  const targetHigh = cost ? cost / 0.72 : null;
  const risk: Audit['materialRisk'] = issues.filter(i => i.severity === 'high').length >= 2 ? 'High' : issues.length >= 3 ? 'Medium' : issues.length ? 'Medium' : 'Low';

  return { lf, height, posts, gates, labor, materials, total, spacing, expectedPosts, materialRisk: risk, marginPct, recommendedLow: targetLow, recommendedHigh: targetHigh, issues };
}

const example = `240 LF 6' privacy fence
31 posts
2 gates
Labor $2,400
Materials $4,100
Total $6,500`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-zinc-100">{copied ? 'Copied' : 'Copy'}</button>;
}

export default function Home() {
  const [estimate, setEstimate] = useState('');
  const [audit, setAudit] = useState<Audit | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const parsedPreview = useMemo(() => estimate ? auditEstimate(estimate) : null, [estimate]);

  function runAudit() { setShowQuote(false); setAudit(auditEstimate(estimate)); }
  function generateQuote() { if (!audit) setAudit(auditEstimate(estimate)); setShowQuote(true); }

  const quote = audit ? `CONTRACTOR QUOTE\n\nProject: ${audit.height ? `${audit.height}-ft` : ''} fence installation\n${audit.lf ? `Fence: ${audit.lf.toLocaleString()} LF` : ''}\n${audit.gates ? `Gates: ${audit.gates}` : ''}\n\nProposed project price: ${money(audit.total ?? audit.recommendedLow)}\n\nScope and final pricing subject to site verification and material availability.` : '';

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold tracking-wide text-zinc-300">FENCE CONTRACTOR TOOL</div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Instant Quote Auditor</h1>
          <p className="mt-4 text-lg text-zinc-400">Catch estimating mistakes before they reach the customer.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl sm:p-7">
            <div className="mb-3 flex items-center justify-between"><label htmlFor="estimate" className="font-bold">Paste your estimate</label><button type="button" onClick={() => setEstimate(example)} className="text-xs font-semibold text-zinc-400 hover:text-white">Load example</button></div>
            <textarea id="estimate" value={estimate} onChange={e => setEstimate(e.target.value)} placeholder={example} className="min-h-80 w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-400" />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={runAudit} disabled={!estimate.trim()} className="rounded-xl bg-white px-5 py-3 font-bold text-zinc-950 disabled:opacity-40">Audit Estimate</button>
              {parsedPreview && <span className="self-center text-xs text-zinc-500">{parsedPreview.lf ? `${parsedPreview.lf} LF` : 'LF not detected'} · {parsedPreview.total ? money(parsedPreview.total) : 'price not detected'}</span>}
            </div>
          </div>

          <div className="space-y-4">
            {!audit && <div className="rounded-3xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">Your estimate report will appear here.</div>}
            {audit && <>
              <section className="rounded-3xl border border-zinc-800 bg-white p-5 text-zinc-950 sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black tracking-widest text-zinc-500">ESTIMATE CHECK</p><h2 className="mt-1 text-2xl font-black">{audit.issues.length} potential issue{audit.issues.length === 1 ? '' : 's'}</h2></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">Material risk: {audit.materialRisk}</span></div>
                <div className="mt-5 space-y-3">
                  {audit.issues.length === 0 && <div className="rounded-xl bg-zinc-100 p-4 font-semibold">No obvious issues detected by the current rules.</div>}
                  {audit.issues.map((issue, i) => <div key={i} className="rounded-2xl border border-zinc-200 p-4"><div className="flex gap-3"><span className="text-lg">{issue.severity === 'high' ? '⚠️' : '•'}</span><div className="flex-1"><p className="font-bold">{issue.title}</p><p className="mt-1 text-sm text-zinc-600">{issue.detail}</p><p className="mt-2 text-sm"><strong>Fix:</strong> {issue.fix}</p></div></div></div>)}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">Margin</p><p className="mt-1 text-2xl font-black">{audit.marginPct == null ? '—' : `${audit.marginPct.toFixed(1)}%`}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">Recommended price</p><p className="mt-1 text-xl font-black">{money(audit.recommendedLow)}–{money(audit.recommendedHigh)}</p></div>
              </div>

              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="font-black">Takeoff snapshot</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">{[['Linear feet', audit.lf ? audit.lf.toLocaleString() : '—'], ['Height', audit.height ? `${audit.height} ft` : '—'], ['Posts', audit.posts?.toString() ?? '—'], ['Gates', audit.gates?.toString() ?? '—'], ['Labor', money(audit.labor)], ['Materials', money(audit.materials)]].map(([label, value]) => <div key={label} className="rounded-xl bg-zinc-950 p-3"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</div>
                <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setShowQuote(true)} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950">Generate Customer Quote</button><button type="button" onClick={() => window.print()} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold hover:bg-zinc-800">Print / Save PDF</button></div>
              </section>

              {showQuote && <section className="rounded-3xl border border-zinc-300 bg-white p-6 text-zinc-950 print:mt-0"><div className="flex items-center justify-between"><h3 className="text-xl font-black">Customer Quote</h3><CopyButton text={quote} /></div><pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-7">{quote}</pre></section>}
            </>}
          </div>
        </section>

        <footer className="mt-10 border-t border-zinc-800 pt-5 text-xs text-zinc-600">Planning aid only. Always verify site conditions, local requirements, supplier pricing, takeoff quantities, and project scope before issuing a final quote.</footer>
      </div>
    </main>
  );
}
