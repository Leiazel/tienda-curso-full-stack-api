/**
 * Error HTTP personalizado con código estructurado y detalles de validación.
 */
export class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
export const PERSON_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

export function isValidPersonName(value) {
  return (
    typeof value === 'string' &&
    value.trim().length >= 2 &&
    value.trim().length <= 80 &&
    PERSON_NAME_REGEX.test(value.trim())
  );
}

export function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parsePositiveInt(value, fieldName = 'id') {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} debe ser un entero positivo`);
  }
  return num;
}

export function throwValidationErrors(details) {
  if (details.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Los datos enviados contienen errores de validación',
      details
    );
  }
}
