import {
  AppError,
  isValidEmail,
  isValidPersonName,
  parsePositiveInt,
  throwValidationErrors,
} from '../middlewares/validate.js';

const VALID_CONTACT_STATUSES = ['new', 'read', 'replied', 'archived'];

function mapContactRow(row) {
  const fullName =
    row.last_name && row.last_name !== '-'
      ? `${row.first_name} ${row.last_name}`
      : row.first_name;

  return {
    id: row.id,
    name: fullName,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createContactMessage(db, payload) {
  const errors = [];
  const rawName = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const hasSeparateNames =
    payload?.firstName !== undefined || payload?.lastName !== undefined;

  let firstName = typeof payload?.firstName === 'string' ? payload.firstName.trim() : '';
  let lastName = typeof payload?.lastName === 'string' ? payload.lastName.trim() : '';

  if (!hasSeparateNames && rawName) {
    if (!isValidPersonName(rawName)) {
      errors.push({
        field: 'name',
        message: 'Nombre obligatorio (solo letras y mínimo 2 caracteres)',
      });
    } else {
      const parts = rawName.split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || '-';
    }
  } else {
    if (!isValidPersonName(firstName)) {
      errors.push({
        field: 'firstName',
        message: 'Nombre obligatorio (solo letras y mínimo 2 caracteres)',
      });
    }
    if (!isValidPersonName(lastName)) {
      errors.push({
        field: 'lastName',
        message: 'Apellido obligatorio (solo letras y mínimo 2 caracteres)',
      });
    }
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const subject =
    typeof payload?.subject === 'string' && payload.subject.trim()
      ? payload.subject.trim().slice(0, 120)
      : 'Consulta general';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }
  if (message.length < 5 || message.length > 1000) {
    errors.push({
      field: 'message',
      message: 'El mensaje debe tener entre 5 y 1000 caracteres',
    });
  }

  throwValidationErrors(errors);

  const [result] = await db.execute(
    `INSERT INTO contact_messages (first_name, last_name, email, subject, message, status)
     VALUES (?, ?, ?, ?, ?, 'new')`,
    [firstName, lastName, email, subject, message]
  );

  const [rows] = await db.execute('SELECT * FROM contact_messages WHERE id = ? LIMIT 1', [
    result.insertId,
  ]);
  return mapContactRow(rows[0]);
}

export async function listContactMessages(db, query = {}) {
  const conditions = [];
  const params = [];

  if (query.status) {
    if (!VALID_CONTACT_STATUSES.includes(query.status)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Estado de contacto inválido');
    }
    conditions.push('status = ?');
    params.push(query.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT * FROM contact_messages ${whereClause} ORDER BY created_at DESC, id DESC`,
    params
  );

  return rows.map(mapContactRow);
}

export async function updateContactStatus(db, id, status) {
  const messageId = parsePositiveInt(id, 'id');
  if (!VALID_CONTACT_STATUSES.includes(status)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Estado inválido "${status}". Permitidos: ${VALID_CONTACT_STATUSES.join(', ')}`
    );
  }

  const [result] = await db.execute('UPDATE contact_messages SET status = ? WHERE id = ?', [
    status,
    messageId,
  ]);
  if (result.affectedRows === 0) {
    throw new AppError(404, 'CONTACT_NOT_FOUND', `Mensaje de contacto ${messageId} no encontrado`);
  }

  const [rows] = await db.execute('SELECT * FROM contact_messages WHERE id = ? LIMIT 1', [
    messageId,
  ]);
  return mapContactRow(rows[0]);
}
