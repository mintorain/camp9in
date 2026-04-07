import { query } from "./db";

interface SettingRow {
  value: string;
}

export async function getAdminPassword(): Promise<string> {
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

export async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  const password = await getAdminPassword();
  return token === password;
}
