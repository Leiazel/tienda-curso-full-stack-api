import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'node-sql-parser';

const { Parser } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((stmt) => stmt.replace(/^--.*$/gm, '').trim())
    .filter((stmt) => stmt && !/^SET\s+NAMES\s+/i.test(stmt));
}

describe('MySQL schema and seed files', () => {
  it('database/schema.sql has valid MySQL syntax and defines all 9 core tables', async () => {
    const schemaPath = path.join(ROOT_DIR, 'database', 'schema.sql');
    const rawSql = await fs.readFile(schemaPath, 'utf8');
    const statements = splitSqlStatements(rawSql);
    const parser = new Parser();

    const createdTables = [];
    for (const stmt of statements) {
      const ast = parser.astify(stmt, { database: 'MySQL' });
      const node = Array.isArray(ast) ? ast[0] : ast;
      if (node?.type === 'create' && node?.keyword === 'table') {
        createdTables.push(node.table[0].table);
      }
    }

    const expectedTables = [
      'categories',
      'products',
      'product_variants',
      'users',
      'promo_codes',
      'orders',
      'order_items',
      'newsletter_subscribers',
      'contact_messages',
    ];

    for (const table of expectedTables) {
      assert.ok(createdTables.includes(table), `Missing table "${table}" in schema.sql`);
    }
  });

  it('database/seed.sql has valid MySQL syntax and includes apparel + footwear + FIRST15 promo', async () => {
    const seedPath = path.join(ROOT_DIR, 'database', 'seed.sql');
    const rawSql = await fs.readFile(seedPath, 'utf8');
    const statements = splitSqlStatements(rawSql);
    const parser = new Parser();

    for (const stmt of statements) {
      assert.doesNotThrow(() => {
        parser.astify(stmt, { database: 'MySQL' });
      });
    }

    assert.match(rawSql, /'hoodies'/);
    assert.match(rawSql, /'sneakers'/);
    assert.match(rawSql, /'apparel'/);
    assert.match(rawSql, /'footwear'/);
    assert.match(rawSql, /'FIRST15'/);
    assert.match(rawSql, /L&D BOXY HEAVYWEIGHT HOODIE/);
    assert.match(rawSql, /L&D LOW-TOP SNEAKER/);
  });
});
