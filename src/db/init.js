import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { getEnvConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

function sanitizeDatabaseName(dbName) {
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(
      `Nombre de base de datos inválido "${dbName}". Usa solo letras, números y guiones bajos.`
    );
  }
  return dbName;
}

function adaptSqlForDatabase(sql, dbName) {
  return sql
    .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[`\w]+[\s\S]*?;/gi, '')
    .replace(/USE\s+[`\w]+\s*;/gi, `USE \`${dbName}\`;`);
}

async function runInit() {
  const { db } = getEnvConfig();
  const dbName = sanitizeDatabaseName(db.database);
  const shouldSeed = process.argv.includes('--seed');

  const schemaPath = path.join(ROOT_DIR, 'database', 'schema.sql');
  const seedPath = path.join(ROOT_DIR, 'database', 'seed.sql');

  const rawSchema = await fs.readFile(schemaPath, 'utf8');
  const schemaSql = adaptSqlForDatabase(rawSchema, dbName);

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    console.log(`Conectando a MySQL en ${db.host}:${db.port} como "${db.user}"...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${dbName}\`;`);
    await connection.query(schemaSql);
    console.log(`Base de datos "${dbName}" y tablas creadas correctamente.`);

    if (shouldSeed) {
      const rawSeed = await fs.readFile(seedPath, 'utf8');
      const seedSql = adaptSqlForDatabase(rawSeed, dbName);
      await connection.query(seedSql);
      console.log(`Datos iniciales cargados en "${dbName}".`);
    }
  } finally {
    await connection.end();
  }
}

runInit().catch((error) => {
  console.error('Error al inicializar la base de datos MySQL:', error.message);
  process.exit(1);
});
