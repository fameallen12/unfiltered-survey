import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { QUESTIONS, validateAnswer } from "@/lib/questions";
import { rateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  // Honeypot: pretend success so bots learn nothing.
  if (typeof body?.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const token = body?.clientToken;
  const answers = body?.answers;
  if (typeof token !== "string" || !UUID.test(token) || typeof answers !== "object" || answers === null)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const row: Record<string, unknown> = { client_token: token };
  for (const q of QUESTIONS) {
    const v = answers[q.key];
    const err = validateAnswer(q, v);
    if (err) return NextResponse.json({ error: `${q.title}: ${err}` }, { status: 400 });
    row[q.key] = q.type === "text" ? (typeof v === "string" && v.trim() ? v.trim() : null) : v;
  }

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing Supabase env vars"); return NextResponse.json({ error: "Server is not configured." }, { status: 500 }); }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("survey_responses").insert(row);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true }); // same token already saved
    console.error("Insert failed:", error.code, error.message);
    return NextResponse.json({ error: "We couldn't save your response. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
