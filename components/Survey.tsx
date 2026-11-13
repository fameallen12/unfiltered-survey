"use client";
import { useRef, useState } from "react";
import { QUESTIONS, MAX_TEXT, validateAnswer, type Answers } from "@/lib/questions";

const TOTAL = QUESTIONS.length;
const newToken = () => crypto.randomUUID();

export default function Survey() {
  // step: -1 intro, 0..TOTAL-1 questions, TOTAL review, TOTAL+1 success
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const token = useRef(newToken());
  const lock = useRef(false);

  const q = step >= 0 && step < TOTAL ? QUESTIONS[step] : null;
  const set = (key: string, v: Answers[string]) => { setAnswers((a) => ({ ...a, [key]: v })); setError(null); };
  const toggle = (key: string, opt: string) => {
    const cur = (answers[key] as string[] | undefined) ?? [];
    set(key, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  const next = () => {
    if (q) { const e = validateAnswer(q, answers[q.key]); if (e) return setError(e); }
    setError(null); setStep((s) => s + 1); window.scrollTo({ top: 0 });
  };
  const prev = () => { setError(null); setStep((s) => Math.max(-1, s - 1)); window.scrollTo({ top: 0 }); };

  const submit = async () => {
    if (lock.current) return; // blocks double-clicks
    for (let i = 0; i < TOTAL; i++) {
      const e = validateAnswer(QUESTIONS[i], answers[QUESTIONS[i].key]);
      if (e) { setStep(i); return setError(e); }
    }
    lock.current = true; setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, clientToken: token.current, website }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStep(TOTAL + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally { lock.current = false; setSubmitting(false); }
  };

  const restart = () => { setAnswers({}); setError(null); token.current = newToken(); setStep(-1); };

  const btn = "rounded-full px-6 py-3 text-base font-medium transition-colors disabled:opacity-50";
  const primary = `${btn} bg-ink text-paper hover:bg-accent`;
  const ghost = `${btn} border border-line bg-white hover:border-ink`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 pb-10 pt-6 sm:px-8">
      <header className="flex items-baseline justify-between">
        <span className="font-display text-xl font-extrabold tracking-tight">UNFILTERED</span>
        <span className="text-sm text-mute">Visuals Worth Creating With.</span>
      </header>

      {q && (
        <div className="mt-6" aria-label="Progress">
          <p className="mb-2 text-sm text-mute">Question {step + 1} of {TOTAL}</p>
          <div className="h-1 rounded-full bg-line"><div className="h-1 rounded-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} /></div>
        </div>
      )}

      <section key={step} className="step-in flex-1 py-10">
        {step === -1 && (
          <div className="pt-6">
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">Tell us what you actually need.</h1>
            <p className="mt-6 max-w-md text-lg text-mute">We&rsquo;re building a marketplace for photographs, textures, mockups and design assets. Ten quick questions, about 2–3 minutes. No sign-up, no email.</p>
            <button className={`${primary} mt-10`} onClick={next}>Start the survey</button>
          </div>
        )}

        {q && (
          <fieldset>
            <legend className="font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{q.prompt}</legend>
            {q.type === "multi" && <p className="mt-2 text-sm text-mute">Select all that apply.</p>}
            {q.type === "text" && <p className="mt-2 text-sm text-mute">Optional.</p>}
            <div className="mt-6">
              {(q.type === "multi" || q.type === "single") && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {q.options!.map((opt) => {
                    const on = q.type === "multi" ? ((answers[q.key] as string[]) ?? []).includes(opt) : answers[q.key] === opt;
                    return (
                      <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[15px] transition-colors ${on ? "border-accent bg-accent/5" : "border-line bg-white hover:border-ink/40"}`}>
                        <input type={q.type === "multi" ? "checkbox" : "radio"} name={q.key} className="h-4 w-4 accent-[#2F3BFF]" checked={on}
                          onChange={() => (q.type === "multi" ? toggle(q.key, opt) : set(q.key, opt))} />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === "rating" && (
                <div>
                  <div className="flex gap-2 sm:gap-3" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={answers[q.key] === n} onClick={() => set(q.key, n)}
                        className={`h-14 flex-1 rounded-2xl border text-lg font-semibold transition-colors ${answers[q.key] === n ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink/40"}`}>{n}</button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-mute"><span>1 · Not useful at all</span><span>5 · Extremely useful</span></div>
                </div>
              )}
              {q.type === "text" && (
                <div>
                  <textarea rows={6} maxLength={MAX_TEXT} value={(answers[q.key] as string) ?? ""} onChange={(e) => set(q.key, e.target.value)}
                    className="w-full rounded-2xl border border-line bg-white p-4 text-base outline-none focus:border-accent" placeholder="Share an idea or recommendation…" />
                  <p className="mt-1 text-right text-xs text-mute">{((answers[q.key] as string) ?? "").length}/{MAX_TEXT}</p>
                </div>
              )}
            </div>
          </fieldset>
        )}

        {step === TOTAL && (
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Review your answers</h2>
            <p className="mt-2 text-mute">Check everything looks right, then submit.</p>
            <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
              {QUESTIONS.map((qq, i) => {
                const v = answers[qq.key];
                const text = Array.isArray(v) ? v.join(", ") : v ? String(v) : "Skipped";
                return (
                  <div key={qq.key} className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0"><dt className="text-sm text-mute">{qq.title}</dt><dd className="mt-0.5 break-words text-[15px]">{text}</dd></div>
                    <button className="shrink-0 text-sm text-accent underline-offset-2 hover:underline" onClick={() => setStep(i)}>Edit</button>
                  </div>
                );
              })}
            </dl>
            {/* Honeypot: hidden from people, tempting to bots */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
              <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
            </div>
          </div>
        )}

        {step === TOTAL + 1 && (
          <div className="pt-6">
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Thank you for helping shape UNFILTERED.</h2>
            <p className="mt-5 max-w-lg text-lg text-mute">Your feedback matters. We&rsquo;re building a creative marketplace around the actual needs of creatives, and your input brings us one step closer.</p>
            <p className="mt-8 font-display text-lg font-bold">UNFILTERED — Visuals Worth Creating With.</p>
            <button className={`${ghost} mt-8`} onClick={restart}>Back to the beginning</button>
          </div>
        )}

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      </section>

      {step >= 0 && step <= TOTAL && (
        <nav className="flex justify-between gap-3 border-t border-line pt-5">
          <button className={ghost} onClick={prev} disabled={submitting}>Previous</button>
          {step < TOTAL
            ? <button className={primary} onClick={next}>{step === TOTAL - 1 ? "Review answers" : "Continue"}</button>
            : <button className={primary} onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit survey"}</button>}
        </nav>
      )}
    </main>
  );
}
