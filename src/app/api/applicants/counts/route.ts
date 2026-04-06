import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();

    const [countsResult, closedResult] = await Promise.all([
      supabase.from("applicant_subjects").select("subject_id"),
      supabase.from("closed_subjects").select("subject_id"),
    ]);

    const counts: Record<string, number> = {};
    for (const row of countsResult.data || []) {
      counts[row.subject_id] = (counts[row.subject_id] || 0) + 1;
    }

    const closedIds = (closedResult.data || []).map((r) => r.subject_id);

    return NextResponse.json({ data: counts, closedIds });
  } catch {
    return NextResponse.json({ data: {}, closedIds: [] });
  }
}
