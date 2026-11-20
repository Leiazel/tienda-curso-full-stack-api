import bcrypt from 'bcryptjs';
import { signAuthToken } from '../middlewares/auth.js';
import {
  AppError,
  isValidEmail,
  isValidPersonName,
  throwValidationErrors,
} from '../middlewares/validate.js';

function mapUserRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export async function registerUser(db, payload) {
  const errors = [];
  const firstName = typeof payload?.firstName === 'string' ? payload.firstName.trim() : '';
  const lastName = typeof payload?.lastName === 'string' ? payload.lastName.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const phone = typeof payload?.phone === 'string' ? payload.phone.trim() : null;

  if (!isValidPersonName(firstName)) {
    errors.push({
      field: 'firstName',
      message: 'Nombre inválido (solo letras y mínimo 2 caracteres)',
    });
  }
  if (!isValidPersonName(lastName)) {
    errors.push({
      field: 'lastName',
      message: 'Apellido inválido (solo letras y mínimo 2 caracteres)',
    });
  }
  if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }
  if (password.length < 6) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  throwValidationErrors(errors);

  const [existing] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length > 0) {
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Ya existe una cuenta registrada con ese email');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.execute(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active)
     VALUES (?, ?, ?, ?, ?, 'customer', 1)`,
    [firstName, lastName, email, passwordHash, phone]
  );

  const user = await getUserProfile(db, result.insertId);
  const token = signAuthToken(user);

  return { user, token };
}

export async function loginUser(db, payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!isValidEmail(email) || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email y contraseña válidos son obligatorios');
  }

  const [rows] = await db.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
  }

  const userRow = rows[0];
  if (!userRow.is_active) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'La cuenta se encuentra deshabilitada');
  }

  const matches = await bcrypt.compare(password, userRow.password_hash);
  if (!matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
  }

  const user = mapUserRow(userRow);
  const token = signAuthToken(user);

  return { user, token };
}

export async function getUserProfile(db, userId) {
  const [rows] = await db.execute(
    `SELECT id, first_name, last_name, email, phone, role, is_active, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [Number(userId)]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');
  }

  return mapUserRow(rows[0]);
}
