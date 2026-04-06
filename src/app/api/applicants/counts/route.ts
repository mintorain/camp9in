import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface CountRow {
  subject_id: string;
  cnt: number;
}

interface ClosedRow {
  subject_id: string;
}

export async function GET() {
  try {
    const countRows = await query<CountRow>(
      "SELECT subject_id, COUNT(*) as cnt FROM applicant_subjects GROUP BY subject_id"
    );

    const closedRows = await query<ClosedRow>(
      "SELECT subject_id FROM closed_subjects"
    );

    const counts: Record<string, number> = {};
    for (const row of countRows) {
      counts[row.subject_id] = row.cnt;
    }

    const closedIds = closedRows.map((r) => r.subject_id);

    return NextResponse.json({ data: counts, closedIds });
  } catch {
    return NextResponse.json({ data: {}, closedIds: [] });
  }
}
