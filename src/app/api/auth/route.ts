import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

interface SettingRow {
  value: string;
}

async function getAdminPassword(): Promise<string> {
  try {
    const rows = await query<SettingRow>(
      "SELECT value FROM settings WHERE `key` = 'admin_password' LIMIT 1"
    );
    if (rows.length > 0 && rows[0].value) {
      return rows[0].value;
    }
  } catch {
    // settings 테이블이 없으면 환경변수 사용
  }
  return process.env.ADMIN_PASSWORD || "camp9in-admin-2026";
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 비밀번호 변경 요청
  if (body.action === "change-password") {
    const authHeader = request.headers.get("authorization");
    const currentPassword = await getAdminPassword();

    if (authHeader !== `Bearer ${currentPassword}`) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    if (!body.newPassword || body.newPassword.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상이어야 합니다" },
        { status: 422 }
      );
    }

    try {
      await query(
        "INSERT INTO settings (`key`, value) VALUES ('admin_password', ?) ON DUPLICATE KEY UPDATE value = ?",
        [body.newPassword, body.newPassword]
      );
      return NextResponse.json({ message: "비밀번호가 변경되었습니다" });
    } catch {
      return NextResponse.json(
        { error: "비밀번호 변경에 실패했습니다" },
        { status: 500 }
      );
    }
  }

  // 로그인 요청
  const currentPassword = await getAdminPassword();

  if (body.password === currentPassword) {
    return NextResponse.json({ token: currentPassword });
  }

  return NextResponse.json(
    { error: "비밀번호가 올바르지 않습니다" },
    { status: 401 }
  );
}
