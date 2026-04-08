import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BUILD_TIME = new Date().toISOString();

export async function GET() {
  return NextResponse.json({ version: BUILD_TIME });
}
