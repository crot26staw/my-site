import "server-only";
import pg from "pg";

/**
 * Пул соединений с PostgreSQL. Один на процесс: в dev Next перезагружает модули, поэтому храним в globalThis.
 * Запросы — только параметризованные ($1, $2...): значения никогда не вклеиваются в текст SQL.
 */

const g = globalThis as typeof globalThis & { __wlPool?: pg.Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL не задан (см. .env.example)");
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Зависший запрос не держит соединение вечно
    statement_timeout: 15_000,
  });
  pool.on("error", (err) => console.error("[db] ошибка соединения в пуле:", err.message));
  return pool;
}

export function db(): pg.Pool {
  g.__wlPool ??= createPool();
  return g.__wlPool;
}

export async function query<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query<T>(sql, params);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}

/** Несколько запросов одной транзакцией: либо все, либо ни одного. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
