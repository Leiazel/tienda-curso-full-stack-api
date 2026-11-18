import { AppError, throwValidationErrors } from '../middlewares/validate.js';

const VALID_DISCOUNT_TYPES = ['percentage', 'fixed'];

function mapPromoRow(row) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderAmount: Number(row.min_order_amount),
    maxUses: row.max_uses !== null ? Number(row.max_uses) : null,
    usedCount: Number(row.used_count),
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at,
  };
}

export async function listPromoCodes(db) {
  const [rows] = await db.execute(
    'SELECT * FROM promo_codes WHERE is_active = 1 ORDER BY id ASC'
  );
  return rows.map(mapPromoRow);
}

export async function validatePromoCode(db, { code, subtotal = 0 }) {
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const numericSubtotal = Number(subtotal);

  if (!normalizedCode) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El código promocional es obligatorio');
  }
  if (Number.isNaN(numericSubtotal) || numericSubtotal < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'subtotal debe ser un número >= 0');
  }

  const [rows] = await db.execute(
    'SELECT * FROM promo_codes WHERE code = ? LIMIT 1',
    [normalizedCode]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'PROMO_NOT_FOUND', `Código promocional "${normalizedCode}" inválido`);
  }

  const promo = rows[0];
  if (!promo.is_active) {
    throw new AppError(400, 'PROMO_INACTIVE', `El código "${normalizedCode}" ya no está activo`);
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    throw new AppError(400, 'PROMO_EXPIRED', `El código "${normalizedCode}" ha expirado`);
  }
  if (promo.max_uses !== null && Number(promo.used_count) >= Number(promo.max_uses)) {
    throw new AppError(
      400,
      'PROMO_MAX_USES',
      `El código "${normalizedCode}" alcanzó el límite de usos`
    );
  }
  if (numericSubtotal < Number(promo.min_order_amount)) {
    throw new AppError(
      400,
      'PROMO_MIN_ORDER',
      `El código "${normalizedCode}" requiere un mínimo de compra de $${Number(promo.min_order_amount)}`
    );
  }

  const discountValue = Number(promo.discount_value);
  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round(numericSubtotal * (discountValue / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(numericSubtotal, discountValue);
  }

  const finalTotal = Math.max(0, Math.round((numericSubtotal - discountAmount) * 100) / 100);

  return {
    valid: true,
    promoCodeId: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discount_type,
    discountValue,
    subtotal: numericSubtotal,
    discountAmount,
    finalTotal,
  };
}

export async function createPromoCode(db, payload) {
  const errors = [];
  const code = typeof payload?.code === 'string' ? payload.code.trim().toUpperCase() : '';
  const discountType = payload?.discountType || 'percentage';
  const discountValue = Number(payload?.discountValue);
  const minOrderAmount = Number(payload?.minOrderAmount ?? 0);

  if (code.length < 3 || code.length > 40) {
    errors.push({ field: 'code', message: 'El código debe tener entre 3 y 40 caracteres' });
  }
  if (!VALID_DISCOUNT_TYPES.includes(discountType)) {
    errors.push({ field: 'discountType', message: 'discountType debe ser percentage o fixed' });
  }
  if (Number.isNaN(discountValue) || discountValue <= 0) {
    errors.push({ field: 'discountValue', message: 'discountValue debe ser > 0' });
  }
  if (discountType === 'percentage' && discountValue > 100) {
    errors.push({ field: 'discountValue', message: 'El porcentaje no puede superar 100' });
  }
  if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
    errors.push({ field: 'minOrderAmount', message: 'minOrderAmount debe ser >= 0' });
  }

  throwValidationErrors(errors);

  const [result] = await db.execute(
    `INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      code,
      payload.description ? String(payload.description).trim() : null,
      discountType,
      discountValue,
      minOrderAmount,
      payload.maxUses ?? null,
      payload.expiresAt ?? null,
    ]
  );

  const [rows] = await db.execute('SELECT * FROM promo_codes WHERE id = ?', [result.insertId]);
  return mapPromoRow(rows[0]);
}
