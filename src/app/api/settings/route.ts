import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

interface SettingRow {
  key: string;
  value: string;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<SettingRow>(
      "SELECT `key`, value FROM settings WHERE `key` IN ('show_counts')"
    );
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json({ data: settings });
  } catch {
    return NextResponse.json({ data: {} });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key와 value가 필요합니다" }, { status: 400 });
    }

    const allowedKeys = ["show_counts"];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "허용되지 않는 설정입니다" }, { status: 400 });
    }

    await insert(
      "INSERT INTO settings (`key`, value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()",
      [key, String(value), String(value)]
    );

    return NextResponse.json({ message: "설정이 저장되었습니다" });
  } catch (err) {
    console.error("Settings error:", err);
    return NextResponse.json({ error: "설정 저장 실패" }, { status: 500 });
  }
}
