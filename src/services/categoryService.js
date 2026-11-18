import { AppError, normalizeSlug, parsePositiveInt, throwValidationErrors } from '../middlewares/validate.js';

const VALID_PRODUCT_TYPES = ['apparel', 'footwear', 'accessory'];

function mapCategoryRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    productType: row.product_type,
    description: row.description,
    displayOrder: row.display_order,
    isActive: Boolean(row.is_active),
    productCount: Number(row.product_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCategories(db, { type, includeInactive = false } = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('c.is_active = 1');
  }

  if (type) {
    if (!VALID_PRODUCT_TYPES.includes(type)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Tipo inválido "${type}". Valores permitidos: ${VALID_PRODUCT_TYPES.join(', ')}`
      );
    }
    conditions.push('c.product_type = ?');
    params.push(type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db.execute(
    `SELECT
       c.id,
       c.slug,
       c.name,
       c.product_type,
       c.description,
       c.display_order,
       c.is_active,
       c.created_at,
       c.updated_at,
       COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     ${whereClause}
     GROUP BY c.id, c.slug, c.name, c.product_type, c.description, c.display_order, c.is_active, c.created_at, c.updated_at
     ORDER BY c.display_order ASC, c.id ASC`,
    params
  );

  return rows.map(mapCategoryRow);
}

export async function getCategoryByIdentifier(db, identifier) {
  const isNumeric = /^\d+$/.test(String(identifier));
  const [rows] = await db.execute(
    `SELECT
       c.id,
       c.slug,
       c.name,
       c.product_type,
       c.description,
       c.display_order,
       c.is_active,
       c.created_at,
       c.updated_at,
       COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     WHERE ${isNumeric ? 'c.id = ?' : 'c.slug = ?'}
     GROUP BY c.id, c.slug, c.name, c.product_type, c.description, c.display_order, c.is_active, c.created_at, c.updated_at
     LIMIT 1`,
    [isNumeric ? Number(identifier) : String(identifier).trim().toLowerCase()]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', `Categoría "${identifier}" no encontrada`);
  }

  return mapCategoryRow(rows[0]);
}

export async function createCategory(db, payload) {
  const errors = [];
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const slug = normalizeSlug(payload?.slug || name);
  const productType = payload?.productType || payload?.product_type || 'apparel';
  const description = typeof payload?.description === 'string' ? payload.description.trim() : null;
  const displayOrder = payload?.displayOrder ?? payload?.display_order ?? 0;

  if (name.length < 2 || name.length > 100) {
    errors.push({ field: 'name', message: 'El nombre debe tener entre 2 y 100 caracteres' });
  }
  if (!slug || slug.length < 2) {
    errors.push({ field: 'slug', message: 'El slug es obligatorio y debe ser alfanumérico' });
  }
  if (!VALID_PRODUCT_TYPES.includes(productType)) {
    errors.push({
      field: 'productType',
      message: `productType debe ser uno de: ${VALID_PRODUCT_TYPES.join(', ')}`,
    });
  }
  if (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0) {
    errors.push({ field: 'displayOrder', message: 'displayOrder debe ser un entero >= 0' });
  }

  throwValidationErrors(errors);

  const [result] = await db.execute(
    `INSERT INTO categories (slug, name, product_type, description, display_order, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [slug, name, productType, description, Number(displayOrder)]
  );

  return getCategoryByIdentifier(db, result.insertId);
}

export async function updateCategory(db, id, payload) {
  const categoryId = parsePositiveInt(id, 'id');
  const existing = await getCategoryByIdentifier(db, categoryId);

  const updates = [];
  const params = [];

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2 || name.length > 100) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El nombre debe tener entre 2 y 100 caracteres');
    }
    updates.push('name = ?');
    params.push(name);
  }

  if (payload.slug !== undefined) {
    const slug = normalizeSlug(payload.slug);
    if (!slug) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El slug no puede estar vacío');
    }
    updates.push('slug = ?');
    params.push(slug);
  }

  const nextType = payload.productType ?? payload.product_type;
  if (nextType !== undefined) {
    if (!VALID_PRODUCT_TYPES.includes(nextType)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `productType debe ser uno de: ${VALID_PRODUCT_TYPES.join(', ')}`
      );
    }
    updates.push('product_type = ?');
    params.push(nextType);
  }

  if (payload.description !== undefined) {
    updates.push('description = ?');
    params.push(payload.description === null ? null : String(payload.description).trim());
  }

  const nextOrder = payload.displayOrder ?? payload.display_order;
  if (nextOrder !== undefined) {
    if (!Number.isInteger(Number(nextOrder)) || Number(nextOrder) < 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'displayOrder debe ser un entero >= 0');
    }
    updates.push('display_order = ?');
    params.push(Number(nextOrder));
  }

  const nextActive = payload.isActive ?? payload.is_active;
  if (nextActive !== undefined) {
    updates.push('is_active = ?');
    params.push(nextActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(categoryId);
  await db.execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
  return getCategoryByIdentifier(db, categoryId);
}

export async function deleteCategory(db, id) {
  const categoryId = parsePositiveInt(id, 'id');
  await getCategoryByIdentifier(db, categoryId);

  const [products] = await db.execute(
    'SELECT COUNT(*) AS total FROM products WHERE category_id = ?',
    [categoryId]
  );

  if (Number(products[0]?.total ?? 0) > 0) {
    throw new AppError(
      409,
      'CATEGORY_IN_USE',
      'No se puede eliminar la categoría porque tiene productos asociados'
    );
  }

  await db.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
  return { deleted: true, id: categoryId };
}
