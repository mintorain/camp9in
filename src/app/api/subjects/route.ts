import { NextResponse } from "next/server";
import { getSubjects } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subjects = await getSubjects();
    return NextResponse.json({ data: subjects });
  } catch (err) {
    console.error("[GET /api/subjects]", err);
    return NextResponse.json({ data: [], error: "조회 실패" }, { status: 500 });
  }
}
