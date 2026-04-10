import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "camp9in",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "camp9in",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      // MySQL wait_timeout 이전에 연결을 살려두기 위한 keepAlive 설정
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000, // 10초마다 keepalive
      // 연결이 끊겼을 때 재연결
      connectTimeout: 10000,
    });

    // 풀 에러가 프로세스를 죽이지 않도록 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pool as any).on("error", (err: NodeJS.ErrnoException) => {
      console.error("[DB Pool Error]", err.message);
      if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
        pool = null; // 다음 요청 시 풀 재생성
      }
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const db = getPool();
  const [rows] = await db.execute(sql, params ?? []);
  return rows as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function insert(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<{ insertId: number }> {
  const db = getPool();
  const [result] = await db.execute(sql, params ?? []);
  return result as { insertId: number };
}
