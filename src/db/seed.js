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

async function runSeed() {
  const { db } = getEnvConfig();
  const dbName = sanitizeDatabaseName(db.database);
  const seedPath = path.join(ROOT_DIR, 'database', 'seed.sql');

  const rawSeed = await fs.readFile(seedPath, 'utf8');
  const seedSql = rawSeed.replace(/USE\s+[`\w]+\s*;/gi, `USE \`${dbName}\`;`);

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: dbName,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    console.log(`Cargando datos iniciales en MySQL (${dbName})...`);
    await connection.query(seedSql);
    console.log('Seed ejecutado correctamente.');
  } finally {
    await connection.end();
  }
}

runSeed().catch((error) => {
  console.error('Error al cargar el seed en MySQL:', error.message);
  process.exit(1);
});
