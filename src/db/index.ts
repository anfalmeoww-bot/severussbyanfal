import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

const dbPath = path.resolve(process.cwd(), config.databaseFile);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA busy_timeout = 5000;");

const migrationsSql = fs.readFileSync(
  path.resolve(__dirname, "migrations.sql"),
  "utf8"
);
db.exec(migrationsSql);

/** Small helper so call sites read like a normal query builder. */
export function all<T = any>(sql: string, params: Record<string, any> = {}): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(params) as T[];
}

export function get<T = any>(sql: string, params: Record<string, any> = {}): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(params) as T | undefined;
}

export function run(sql: string, params: Record<string, any> = {}) {
  const stmt = db.prepare(sql);
  return stmt.run(params);
}

export function now(): number {
  return Date.now();
}
