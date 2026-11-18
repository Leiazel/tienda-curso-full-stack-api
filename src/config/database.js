import mysql from 'mysql2/promise';
import { getEnvConfig } from './env.js';

let defaultPool = null;

/**
 * Crea un pool de conexiones MySQL usando mysql2/promise.
 */
export function createDbPool(overrides = {}) {
  const { db } = getEnvConfig();

  return mysql.createPool({
    host: overrides.host ?? db.host,
    port: overrides.port ?? db.port,
    user: overrides.user ?? db.user,
    password: overrides.password ?? db.password,
    database: overrides.database ?? db.database,
    waitForConnections: true,
    connectionLimit: overrides.connectionLimit ?? db.connectionLimit,
    queueLimit: 0,
    decimalNumbers: true,
    charset: 'utf8mb4',
  });
}

/**
 * Obtiene (o inicializa de forma perezosa) el pool singleton de MySQL.
 */
export function getDbPool() {
  if (!defaultPool) {
    defaultPool = createDbPool();
  }
  return defaultPool;
}

/**
 * Verifica conectividad real con el servidor MySQL.
 */
export async function checkDatabaseHealth(db = getDbPool()) {
  const { db: dbConfig } = getEnvConfig();
  try {
    await db.execute('SELECT 1 AS ok');
    return {
      status: 'connected',
      engine: 'mysql',
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      engine: 'mysql',
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      error: error.code || error.message,
    };
  }
}

/**
 * Ejecuta una función dentro de una transacción MySQL.
 * Si el callback arroja error, realiza rollback automático.
 */
export async function withTransaction(db, callback) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignora error secundario durante rollback
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cierra el pool singleton durante el apagado controlado del servidor.
 */
export async function closeDbPool() {
  if (defaultPool) {
    await defaultPool.end();
    defaultPool = null;
  }
}
