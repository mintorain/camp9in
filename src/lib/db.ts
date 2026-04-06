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
      connectionLimit: 10,
      queueLimit: 0,
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
