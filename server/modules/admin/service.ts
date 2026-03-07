import { and, eq, getTableColumns, is } from 'drizzle-orm'
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core'
import { db } from 'server/db'
import * as schema from 'server/schema'

type Tables = { [K in keyof typeof schema as typeof schema[K] extends SQLiteTable ? K : never]: typeof schema[K] & SQLiteTable }

const TABLE_MAP = Object.fromEntries(
  Object.entries(schema).filter(([, v]) => is(v, SQLiteTable)),
) as Tables

type TableName = keyof Tables

export const tableNames: string[] = Object.keys(TABLE_MAP)

function isTableName(name: string): name is TableName {
  return name in TABLE_MAP
}

function derivePKs(drizzleTable: SQLiteTable): string[] {
  const config = getTableConfig(drizzleTable)
  const cols = getTableColumns(drizzleTable) as Record<string, any>
  const sqlToJs = new Map(Object.entries(cols).map(([jsName, col]) => [col.name, jsName]))
  if (config.primaryKeys.length > 0)
    return config.primaryKeys.flatMap(pk => pk.columns.map((col: any) => sqlToJs.get(col.name) ?? col.name))
  return Object.entries(cols).filter(([, col]) => col.primary).map(([jsName]) => jsName)
}

const TABLE_PK: Record<TableName, string[]> = Object.fromEntries(
  Object.entries(TABLE_MAP).map(([name, table]) => [name, derivePKs(table as SQLiteTable)]),
) as Record<TableName, string[]>

type Row = Record<string, unknown>

function buildWhere(name: TableName, pk: Row) {
  const t = TABLE_MAP[name] as any
  const conditions = TABLE_PK[name].map(col => eq(t[col], pk[col]))
  return conditions.length === 1 ? conditions[0]! : and(...conditions)
}

export function queryTable(name: string) {
  if (!isTableName(name))
    return null
  return { rows: db.select().from(TABLE_MAP[name]).all(), pks: TABLE_PK[name] }
}

export function deleteTableRow(table: string, pk: Row): boolean {
  if (!isTableName(table))
    return false
  db.delete(TABLE_MAP[table]).where(buildWhere(table, pk)).run()
  return true
}

export function updateTableRow(table: string, pk: Row, values: Row): boolean {
  if (!isTableName(table))
    return false
  const pkCols = TABLE_PK[table]
  const setValues = Object.fromEntries(Object.entries(values).filter(([k]) => !pkCols.includes(k)))
  if (!Object.keys(setValues).length)
    return false
  db.update(TABLE_MAP[table]).set(setValues).where(buildWhere(table, pk)).run()
  return true
}

export function insertTableRow(table: string, values: Row): boolean {
  if (!isTableName(table))
    return false
  db.insert(TABLE_MAP[table]).values(values).run()
  return true
}
