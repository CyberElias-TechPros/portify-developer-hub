/**
 * Generic REST <-> SQLite query engine with policy enforcement.
 *
 *   GET    /api/db/:table?select=*&f.user_id=eq.1&order=created_at.desc&limit=20&count=exact
 *   POST   /api/db/:table            { rows: [...] }  (array or single object accepted)
 *   PATCH  /api/db/:table?f.id=eq.x  { ...patch }
 *   DELETE /api/db/:table?f.id=eq.x
 *
 * Filter syntax: `f.<column>=<op>.<value>` (repeatable). Supported ops:
 *   eq, neq, gt, gte, lt, lte, like, ilike, in, is, not.<op>
 */
import { HttpError, toInt } from './http';
import { assertColumn, getTable, type DBContext, type Row, type Scope, type TablePolicy } from './tables';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 500;

interface ParsedQuery {
  where: string;
  params: unknown[];
  order: string;
  limit: number;
  offset: number;
  columns: string[];
  count: boolean;
  embeds: string[];
}

function snake(value: string) {
  return value;
}

export function parseQuery(query: URLSearchParams, policy: TablePolicy, ctx?: DBContext): ParsedQuery {
  const whereParts: string[] = [];
  const params: unknown[] = [];

  // 1. Row-level security scope.
  if (policy.read && ctx) {
    const scope = policy.read(ctx);
    if (scope === null) throw HttpError.unauthorized('Sign in to access this collection');
    if (scope.sql && scope.sql !== '1 = 1') {
      whereParts.push(scope.sql);
      params.push(...scope.params);
    }
  }

  // 2. Client supplied filters.
  for (const [key, rawValue] of query.entries()) {
    if (!key.startsWith('f.')) continue;
    const column = assertColumn(policy, snake(key.slice(2)));
    const [op, ...rest] = rawValue.split('.');
    const value = rest.join('.');
    const clause = buildClause(column, op, value, params);
    if (clause) whereParts.push(clause);
  }

  const order = parseOrder(query.get('order'), policy);
  const limit = Math.min(Math.max(toInt(query.get('limit'), DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(toInt(query.get('offset'), 0), 0);
  const columns = parseSelect(query.get('select'), policy);
  const embeds = (query.get('embed') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.split(':')[0].split('(')[0].trim());

  return {
    where: whereParts.length ? whereParts.join(' AND ') : '1 = 1',
    params,
    order,
    limit,
    offset,
    columns,
    count: query.get('count') === 'exact',
    embeds,
  };
}

function buildClause(column: string, op: string, value: string, params: unknown[]): string | null {
  const push = (v: unknown) => {
    params.push(v);
    return '?';
  };
  switch (op) {
    case 'eq':
      return `${column} = ${push(coerce(value))}`;
    case 'neq':
    case 'ne':
      return `${column} <> ${push(coerce(value))}`;
    case 'gt':
      return `${column} > ${push(coerce(value))}`;
    case 'gte':
      return `${column} >= ${push(coerce(value))}`;
    case 'lt':
      return `${column} < ${push(coerce(value))}`;
    case 'lte':
      return `${column} <= ${push(coerce(value))}`;
    case 'like':
      return `${column} LIKE ${push(value)}`;
    case 'ilike':
      return `lower(${column}) LIKE lower(${push(value)})`;
    case 'in': {
      const items = value.split(',').map((v) => coerce(v.trim())).filter((v) => v !== '');
      if (!items.length) return '1 = 0';
      return `${column} IN (${items.map((i) => push(i)).join(', ')})`;
    }
    case 'is':
      return handleIs(column, value, false);
    case 'not': {
      const [innerOp, ...rest] = value.split('.');
      const innerValue = rest.join('.');
      if (innerOp === 'is') return handleIs(column, innerValue, true);
      const clause = buildClause(column, innerOp, innerValue, params);
      return clause ? `NOT (${clause})` : null;
    }
    case 'contains': {
      return `(${column} LIKE ${push(`%${value}%`)})`;
    }
    default:
      throw HttpError.badRequest(`Unsupported filter operator "${op}"`);
  }
}

function handleIs(column: string, value: string, negate: boolean): string {
  const normalised = value.toLowerCase();
  if (normalised === 'null') return `${column} IS ${negate ? 'NOT ' : ''}NULL`;
  const truthy = normalised === 'true' || normalised === '1';
  return `${column} IS ${negate ? 'NOT ' : ''}${truthy ? '1' : '0'}`;
}

function coerce(value: string): unknown {
  if (value === 'null') return null;
  if (value === 'true') return 1;
  if (value === 'false') return 0;
  return value;
}

function parseOrder(order: string | null, policy: TablePolicy): string {
  const fallback = policy.defaultOrder ?? 'created_at DESC';
  if (!order) return normaliseOrder(fallback);
  const parts: string[] = [];
  for (const chunk of order.split(',')) {
    const [rawColumn, rawDir] = chunk.split('.');
    const column = rawColumn?.trim();
    if (!column) continue;
    if (!policy.columns.includes(column)) continue;
    const dir = (rawDir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    parts.push(`${column} ${dir}`);
  }
  return parts.length ? parts.join(', ') : normaliseOrder(fallback);
}

function normaliseOrder(order: string): string {
  return order
    .split(',')
    .map((chunk) => {
      const [column, dir] = chunk.trim().split('.');
      if (!dir) return chunk.replace(/\s+/g, ' ').trim();
      return `${column} ${dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    })
    .join(', ');
}

function parseSelect(select: string | null, policy: TablePolicy): string[] {
  if (!select || select.trim() === '*' || select.includes('*')) {
    return visibleColumns(policy);
  }
  const wanted = select
    .split(',')
    .map((c) => c.trim().split(':')[0].split('(')[0].trim())
    .filter(Boolean)
    .map((c) => assertColumn(policy, c, true))
    .filter((c) => policy.columns.includes(c));
  const set = new Set([...wanted, ...visibleColumns(policy).filter((c) => ['id', 'user_id'].includes(c))]);
  if (policy.columns.includes('created_at')) set.add('created_at');
  return [...set];
}

export function visibleColumns(policy: TablePolicy): string[] {
  const hidden = new Set(policy.privateColumns ?? []);
  return policy.columns.filter((c) => !hidden.has(c));
}

function rowOut(policy: TablePolicy, row: Row): Row {
  const out: Row = {};
  for (const column of policy.columns) {
    if (policy.privateColumns?.includes(column)) continue;
    let value = row[column];
    if (policy.jsonColumns?.includes(column) && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        value = null;
      }
    }
    out[column] = value;
  }
  return out;
}

// ------------------------------------------------------------------- read --
export async function listRows(ctx: DBContext, table: string, query: URLSearchParams): Promise<{ data: Row[]; count: number | null }> {
  const policy = getTable(table);
  const parsed = parseQuery(query, policy, ctx);
  const columns = parsed.columns.map((c) => (c === '*' ? 'id' : c)).join(', ');
  const sql = `SELECT ${columns} FROM ${policy.name} WHERE ${parsed.where} ORDER BY ${parsed.order} LIMIT ? OFFSET ?`;
  const stmt = ctx.env.DB.prepare(sql).bind(...parsed.params, parsed.limit, parsed.offset);
  const result = await stmt.all<Row>();
  let rows = (result.results ?? []).map((row) => rowOut(policy, row));

  if (parsed.embeds.length) {
    rows = await attachRelations(ctx, policy, rows, parsed.embeds);
  }

  let count: number | null = null;
  if (parsed.count) {
    const countResult = await ctx.env.DB.prepare(
      `SELECT COUNT(*) AS c FROM ${policy.name} WHERE ${parsed.where}`
    )
      .bind(...parsed.params)
      .first<{ c: number }>();
    count = countResult?.c ?? 0;
  }

  return { data: rows, count };
}

async function attachRelations(ctx: DBContext, policy: TablePolicy, rows: Row[], embeds: string[]): Promise<Row[]> {
  for (const name of embeds) {
    const spec = policy.relations?.[name];
    if (!spec || !rows.length) continue;
    const relatedPolicy = getTable(spec.table);
    const ids = [...new Set(rows.map((r) => r[spec.localKey]).filter((v) => v !== null && v !== undefined))];
    if (!ids.length) {
      rows = rows.map((r) => ({ ...r, [name]: spec.as === 'array' ? [] : null }));
      continue;
    }

    let scope: Scope | null = { sql: '1 = 1', params: [] };
    if (relatedPolicy.read) scope = relatedPolicy.read(ctx);
    if (scope === null) {
      rows = rows.map((r) => ({ ...r, [name]: spec.as === 'array' ? [] : null }));
      continue;
    }

    const columns = (spec.columns ?? relatedPolicy.columns).filter((c) => relatedPolicy.columns.includes(c));
    const placeholders = ids.map(() => '?').join(', ');
    const sql = `SELECT ${columns.join(', ')} FROM ${relatedPolicy.name} WHERE ${spec.foreignKey} IN (${placeholders})${
      scope.sql && scope.sql !== '1 = 1' ? ` AND ${scope.sql}` : ''
    }`;
    const result = await ctx.env.DB.prepare(sql)
      .bind(...ids, ...scope.params)
      .all<Row>();
    const related = (result.results ?? []).map((row) => rowOut(relatedPolicy, row));

    rows = rows.map((row) => {
      const local = row[spec.localKey];
      const matches = related.filter((rel) => rel[spec.foreignKey] === local);
      return { ...row, [name]: spec.as === 'array' ? matches : matches[0] ?? null };
    });
  }
  return rows;
}

export async function getOne(ctx: DBContext, table: string, id: string): Promise<Row | null> {
  const { data } = await listRows(ctx, table, new URLSearchParams({ 'f.id': `eq.${id}`, limit: '1' }));
  return data[0] ?? null;
}

// ----------------------------------------------------------------- insert --
export async function insertRows(ctx: DBContext, table: string, input: Row | Row[]): Promise<Row[]> {
  const policy = getTable(table);
  const incoming = Array.isArray(input) ? input : [input];
  if (!incoming.length) throw HttpError.badRequest('No rows supplied');

  const prepared = incoming.map((raw) => {
    if (!raw || typeof raw !== 'object') throw HttpError.badRequest('Each row must be an object');
    const row: Row = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!policy.columns.includes(key)) continue; // silently drop unknown columns
      row[key] = policy.jsonColumns?.includes(key) && value !== null && typeof value !== 'string'
        ? JSON.stringify(value)
        : value;
    }
    let candidate = policy.serverInsert ? policy.serverInsert(ctx, row) : { id: row.id ?? crypto.randomUUID(), ...row };
    // Strip anything the server injected that is not a column.
    const clean: Row = {};
    for (const column of policy.columns) if (candidate[column] !== undefined) clean[column] = candidate[column];
    return clean;
  });

  for (const row of prepared) {
    if (policy.canInsert && !policy.canInsert(ctx, row)) {
      throw HttpError.forbidden(`You are not allowed to create ${policy.name} rows with those values`);
    }
  }

  const results: Row[] = [];
  for (const row of prepared) {
    const columns = Object.keys(row);
    const sql = `INSERT INTO ${policy.name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    await ctx.env.DB.prepare(sql).bind(...columns.map((c) => row[c])).run();
    const stored = await getOneRaw(ctx, policy, row.id);
    if (stored) {
      results.push(rowOut(policy, stored));
      if (policy.afterInsert) {
        try {
          await policy.afterInsert(ctx, stored);
        } catch (error) {
          console.warn('[hooks] afterInsert failed', policy.name, error);
        }
      }
    }
  }
  return results;
}

async function getOneRaw(ctx: DBContext, policy: TablePolicy, id: unknown): Promise<Row | null> {
  if (id === undefined || id === null) return null;
  const pk = policy.columns.includes('id') ? 'id' : null;
  if (!pk) return null;
  return await ctx.env.DB.prepare(`SELECT * FROM ${policy.name} WHERE ${pk} = ?`).bind(id).first<Row>();
}

// ----------------------------------------------------------------- update --
export async function updateRows(ctx: DBContext, table: string, query: URLSearchParams, patch: Row): Promise<Row[]> {
  const policy = getTable(table);
  const parsed = parseQuery(query, policy, ctx);
  const matches = await ctx.env.DB.prepare(
    `SELECT * FROM ${policy.name} WHERE ${parsed.where} ORDER BY ${parsed.order} LIMIT ?`
  )
    .bind(...parsed.params, parsed.limit)
    .all<Row>();

  const rows = matches.results ?? [];
  if (!rows.length) return [];

  const cleanPatch: Row = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!policy.columns.includes(key)) continue;
    if (['id', 'user_id', 'created_at'].includes(key)) continue;
    cleanPatch[key] = policy.jsonColumns?.includes(key) && value !== null && typeof value !== 'string'
      ? JSON.stringify(value)
      : value;
  }
  if (!Object.keys(cleanPatch).length) throw HttpError.badRequest('Nothing to update');
  if (policy.columns.includes('updated_at')) cleanPatch.updated_at = new Date().toISOString();

  const updated: Row[] = [];
  for (const row of rows) {
    if (policy.canUpdate && !policy.canUpdate(ctx, row, cleanPatch)) {
      throw HttpError.forbidden(`You cannot update this ${policy.name} record`);
    }
    const columns = Object.keys(cleanPatch);
    await ctx.env.DB.prepare(
      `UPDATE ${policy.name} SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`
    )
      .bind(...columns.map((c) => cleanPatch[c]), row.id)
      .run();
    const stored = await getOneRaw(ctx, policy, row.id);
    if (stored) {
      updated.push(rowOut(policy, stored));
      if (policy.afterUpdate) {
        try {
          await policy.afterUpdate(ctx, stored, cleanPatch);
        } catch (error) {
          console.warn('[hooks] afterUpdate failed', policy.name, error);
        }
      }
    }
  }
  return updated;
}

// ----------------------------------------------------------------- delete --
export async function deleteRows(ctx: DBContext, table: string, query: URLSearchParams): Promise<Row[]> {
  const policy = getTable(table);
  const parsed = parseQuery(query, policy, ctx);
  const matches = await ctx.env.DB.prepare(`SELECT * FROM ${policy.name} WHERE ${parsed.where} LIMIT ?`)
    .bind(...parsed.params, parsed.limit)
    .all<Row>();
  const rows = matches.results ?? [];
  if (!rows.length) return [];

  const removed: Row[] = [];
  for (const row of rows) {
    if (policy.canDelete && !policy.canDelete(ctx, row)) {
      throw HttpError.forbidden(`You cannot delete this ${policy.name} record`);
    }
    await ctx.env.DB.prepare(`DELETE FROM ${policy.name} WHERE id = ?`).bind(row.id).run();
    removed.push(rowOut(policy, row));
    if (policy.afterDelete) {
      try {
        await policy.afterDelete(ctx, row);
      } catch (error) {
        console.warn('[hooks] afterDelete failed', policy.name, error);
      }
    }
  }
  return removed;
}

// ------------------------------------------------------------------ upsert --
export async function upsertRows(ctx: DBContext, table: string, input: Row[], onConflict: string): Promise<Row[]> {
  const policy = getTable(table);
  const conflicts = onConflict
    .split(',')
    .map((c) => c.trim())
    .filter((c) => policy.columns.includes(c));
  if (!conflicts.length) return insertRows(ctx, table, input);

  const results: Row[] = [];
  for (const raw of input) {
    const filters = new URLSearchParams({ limit: '1' });
    for (const column of conflicts) {
      if (raw[column] === undefined) continue;
      filters.set(`f.${column}`, `eq.${raw[column]}`);
    }
    const existing = await ctx.env.DB.prepare(
      `SELECT id FROM ${policy.name} WHERE ${conflicts.map((c) => `${c} = ?`).join(' AND ')} LIMIT 1`
    )
      .bind(...conflicts.map((c) => raw[c]))
      .first<{ id: string }>();

    if (existing) {
      results.push(...(await updateRows(ctx, table, new URLSearchParams({ 'f.id': `eq.${existing.id}`, limit: '1' }), raw)));
    } else {
      results.push(...(await insertRows(ctx, table, raw)));
    }
  }
  return results;
}
