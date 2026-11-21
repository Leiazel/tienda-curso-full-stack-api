import { withTransaction } from '../config/database.js';
import {
  AppError,
  HEX_COLOR_REGEX,
  normalizeSlug,
  parsePositiveInt,
  throwValidationErrors,
} from '../middlewares/validate.js';

const VALID_PRODUCT_TYPES = ['apparel', 'footwear', 'accessory'];
const VALID_GENDERS = ['unisex', 'men', 'women'];

function parseJsonArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapVariantRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    colorHex: row.color_hex,
    stock: Number(row.stock),
    priceOverride: row.price_override !== null && row.price_override !== undefined
      ? Number(row.price_override)
      : null,
    isActive: Boolean(row.is_active),
  };
}

function resolveImageUrl(url, baseUrl = '') {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && baseUrl) {
    return `${baseUrl.replace(/\/+$/, '')}${trimmed}`;
  }
  return trimmed;
}

function formatProduct(row, variantRows = [], { baseUrl = '' } = {}) {
  const variants = variantRows.map(mapVariantRow);
  const activeVariants = variants.filter((v) => v.isActive);
  const sizes = [];
  for (const variant of activeVariants) {
    if (!sizes.includes(variant.size)) {
      sizes.push(variant.size);
    }
  }
  if (sizes.length === 0 && row.default_size) {
    sizes.push(row.default_size);
  }

  const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0);
  const resolvedImage = resolveImageUrl(row.image_url, baseUrl);
  const resolvedGallery = parseJsonArray(row.gallery_urls).map((url) =>
    resolveImageUrl(url, baseUrl)
  );

  return {
    id: row.id,
    slug: row.slug,
    skuPrefix: row.sku_prefix,
    name: row.name,
    title: row.name,
    subtitle: row.subtitle,
    description: row.description,
    brand: row.brand,
    gender: row.gender,
    material: row.material,
    fit: row.fit,
    categoryId: row.category_id,
    category: row.category_slug,
    categoryName: row.category_name,
    productType: row.product_type,
    price: Number(row.price),
    compareAtPrice:
      row.compare_at_price !== null && row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : null,
    badge: row.badge,
    image: resolvedImage,
    imageUrl: resolvedImage,
    galleryUrls: resolvedGallery,
    defaultSize: row.default_size,
    sizes,
    totalStock,
    inStock: totalStock > 0,
    variants,
    isFeatured: Boolean(row.is_featured),
    extra: !Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function attachVariants(db, productRows, options = {}) {
  if (productRows.length === 0) return [];
  const productIds = productRows.map((p) => p.id);
  const placeholders = productIds.map(() => '?').join(', ');

  const [variantRows] = await db.execute(
    `SELECT id, product_id, sku, size, color, color_hex, stock, price_override, is_active
     FROM product_variants
     WHERE product_id IN (${placeholders})
     ORDER BY id ASC`,
    productIds
  );

  const grouped = new Map();
  for (const variant of variantRows) {
    if (!grouped.has(variant.product_id)) {
      grouped.set(variant.product_id, []);
    }
    grouped.get(variant.product_id).push(variant);
  }

  return productRows.map((product) =>
    formatProduct(product, grouped.get(product.id) || [], options)
  );
}

export async function listProducts(db, query = {}, options = {}) {
  const conditions = [];
  const params = [];

  const includeInactive = String(query.includeInactive || '').toLowerCase() === 'true';
  if (!includeInactive) {
    conditions.push('p.is_active = 1');
  }

  if (query.category) {
    const rawCat = String(query.category).trim().toLowerCase();
    if (rawCat !== 'all') {
      if (/^\d+$/.test(rawCat)) {
        conditions.push('p.category_id = ?');
        params.push(Number(rawCat));
      } else {
        conditions.push('c.slug = ?');
        params.push(rawCat);
      }
    }
  }

  if (query.type) {
    const type = String(query.type).trim().toLowerCase();
    if (!VALID_PRODUCT_TYPES.includes(type)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Tipo de producto inválido "${type}". Valores permitidos: ${VALID_PRODUCT_TYPES.join(', ')}`
      );
    }
    conditions.push('p.product_type = ?');
    params.push(type);
  }

  if (query.gender) {
    const gender = String(query.gender).trim().toLowerCase();
    if (!VALID_GENDERS.includes(gender)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Género inválido "${gender}". Valores permitidos: ${VALID_GENDERS.join(', ')}`
      );
    }
    conditions.push('p.gender = ?');
    params.push(gender);
  }

  if (query.featured !== undefined) {
    const isFeatured = String(query.featured).toLowerCase() === 'true' || query.featured === '1';
    conditions.push('p.is_featured = ?');
    params.push(isFeatured ? 1 : 0);
  }

  if (query.minPrice !== undefined && query.minPrice !== '') {
    const minPrice = Number(query.minPrice);
    if (Number.isNaN(minPrice) || minPrice < 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'minPrice debe ser un número mayor o igual a 0');
    }
    conditions.push('p.price >= ?');
    params.push(minPrice);
  }

  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const maxPrice = Number(query.maxPrice);
    if (Number.isNaN(maxPrice) || maxPrice < 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'maxPrice debe ser un número mayor o igual a 0');
    }
    conditions.push('p.price <= ?');
    params.push(maxPrice);
  }

  if (query.size) {
    conditions.push(
      'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1 AND pv.size = ?)'
    );
    params.push(String(query.size).trim());
  }

  if (String(query.inStock || '').toLowerCase() === 'true' || query.inStock === '1') {
    conditions.push(
      'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1 AND pv.stock > 0)'
    );
  }

  if (query.search && String(query.search).trim()) {
    const term = `%${String(query.search).trim()}%`;
    conditions.push(
      '(p.name LIKE ? OR p.subtitle LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR p.brand LIKE ?)'
    );
    params.push(term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    price_asc: 'p.price ASC, p.id ASC',
    price_desc: 'p.price DESC, p.id ASC',
    name: 'p.name ASC, p.id ASC',
    newest: 'p.created_at DESC, p.id DESC',
    featured: 'p.is_featured DESC, p.id ASC',
  };
  const orderBy = sortMap[query.sort] || 'p.is_featured DESC, p.id ASC';

  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '20', 10) || 20));
  const offset = (page - 1) * limit;

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [productRows] = await db.execute(
    `SELECT
       p.*,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const items = await attachVariants(db, productRows, options);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getProductByIdentifier(db, identifier, options = {}) {
  const isNumeric = /^\d+$/.test(String(identifier));
  const [rows] = await db.execute(
    `SELECT
       p.*,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
     LIMIT 1`,
    [isNumeric ? Number(identifier) : String(identifier).trim().toLowerCase()]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Producto "${identifier}" no encontrado`);
  }

  const [formatted] = await attachVariants(db, rows, options);
  return formatted;
}

async function resolveCategory(conn, payload) {
  if (payload.categoryId !== undefined || payload.category_id !== undefined) {
    const id = parsePositiveInt(payload.categoryId ?? payload.category_id, 'categoryId');
    const [rows] = await conn.execute('SELECT id, product_type FROM categories WHERE id = ? LIMIT 1', [
      id,
    ]);
    if (rows.length === 0) {
      throw new AppError(400, 'INVALID_REFERENCE', `La categoría ${id} no existe`);
    }
    return rows[0];
  }

  const slug = payload.category || payload.categorySlug || payload.category_slug;
  if (slug) {
    const [rows] = await conn.execute(
      'SELECT id, product_type FROM categories WHERE slug = ? LIMIT 1',
      [String(slug).trim().toLowerCase()]
    );
    if (rows.length === 0) {
      throw new AppError(400, 'INVALID_REFERENCE', `La categoría "${slug}" no existe`);
    }
    return rows[0];
  }

  throw new AppError(400, 'VALIDATION_ERROR', 'Debes indicar categoryId o category (slug)');
}

function normalizeVariantInput(variant, index, skuPrefix, defaultSize) {
  const size = typeof variant?.size === 'string' && variant.size.trim()
    ? variant.size.trim()
    : defaultSize;
  const color = typeof variant?.color === 'string' && variant.color.trim()
    ? variant.color.trim()
    : 'Washed Black';
  const colorHex = variant?.colorHex ?? variant?.color_hex ?? null;
  const stock = Number(variant?.stock ?? 0);
  const priceOverride = variant?.priceOverride ?? variant?.price_override ?? null;

  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `El stock de la variante #${index + 1} debe ser un entero >= 0`
    );
  }
  if (colorHex && !HEX_COLOR_REGEX.test(colorHex)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `colorHex inválido en variante #${index + 1}. Usa formato #RRGGBB`
    );
  }
  if (priceOverride !== null && (Number.isNaN(Number(priceOverride)) || Number(priceOverride) <= 0)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `priceOverride inválido en variante #${index + 1}`
    );
  }

  const safeSizeCode = size.toUpperCase().replace(/[^A-Z0-9]+/g, '');
  const sku =
    typeof variant?.sku === 'string' && variant.sku.trim()
      ? variant.sku.trim().toUpperCase()
      : `${skuPrefix}-${safeSizeCode}-${index + 1}`;

  return {
    sku,
    size,
    color,
    colorHex,
    stock,
    priceOverride: priceOverride !== null ? Number(priceOverride) : null,
  };
}

export async function createProduct(db, payload, options = {}) {
  const errors = [];
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const slug = normalizeSlug(payload?.slug || name);
  const price = Number(payload?.price);
  const compareAtPrice =
    payload?.compareAtPrice !== undefined && payload?.compareAtPrice !== null
      ? Number(payload.compareAtPrice)
      : null;
  const imageUrl = typeof (payload?.imageUrl ?? payload?.image) === 'string'
    ? (payload.imageUrl ?? payload.image).trim()
    : '';
  const defaultSize = typeof (payload?.defaultSize ?? payload?.default_size) === 'string'
    ? (payload.defaultSize ?? payload.default_size).trim()
    : '';
  const gender = payload?.gender || 'unisex';

  if (name.length < 2 || name.length > 150) {
    errors.push({ field: 'name', message: 'El nombre debe tener entre 2 y 150 caracteres' });
  }
  if (!slug) {
    errors.push({ field: 'slug', message: 'No se pudo generar un slug válido' });
  }
  if (Number.isNaN(price) || price <= 0) {
    errors.push({ field: 'price', message: 'El precio debe ser un número mayor a 0' });
  }
  if (compareAtPrice !== null && (Number.isNaN(compareAtPrice) || compareAtPrice <= 0)) {
    errors.push({ field: 'compareAtPrice', message: 'compareAtPrice debe ser mayor a 0' });
  }
  if (!imageUrl) {
    errors.push({ field: 'imageUrl', message: 'imageUrl (o image) es obligatorio' });
  }
  if (!defaultSize) {
    errors.push({ field: 'defaultSize', message: 'defaultSize es obligatorio (ej: "L", "US 9.5")' });
  }
  if (!VALID_GENDERS.includes(gender)) {
    errors.push({ field: 'gender', message: `gender debe ser: ${VALID_GENDERS.join(', ')}` });
  }
  if (payload?.productType && !VALID_PRODUCT_TYPES.includes(payload.productType)) {
    errors.push({
      field: 'productType',
      message: `productType debe ser: ${VALID_PRODUCT_TYPES.join(', ')}`,
    });
  }

  throwValidationErrors(errors);

  const skuPrefix =
    typeof (payload.skuPrefix ?? payload.sku_prefix) === 'string' &&
    (payload.skuPrefix ?? payload.sku_prefix).trim()
      ? (payload.skuPrefix ?? payload.sku_prefix).trim().toUpperCase()
      : slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 32);

  const createdId = await withTransaction(db, async (conn) => {
    const category = await resolveCategory(conn, payload);
    const productType = payload.productType || payload.product_type || category.product_type;
    const galleryUrls = Array.isArray(payload.galleryUrls)
      ? payload.galleryUrls
      : [imageUrl];

    const [result] = await conn.execute(
      `INSERT INTO products (
         slug, sku_prefix, category_id, product_type, name, subtitle, description,
         brand, gender, material, fit, price, compare_at_price, badge,
         image_url, gallery_urls, default_size, is_featured, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        slug,
        skuPrefix,
        category.id,
        productType,
        name,
        payload.subtitle ? String(payload.subtitle).trim() : null,
        payload.description ? String(payload.description).trim() : null,
        payload.brand ? String(payload.brand).trim() : 'L&D',
        gender,
        payload.material ? String(payload.material).trim() : null,
        payload.fit ? String(payload.fit).trim() : null,
        price,
        compareAtPrice,
        payload.badge ? String(payload.badge).trim() : null,
        imageUrl,
        JSON.stringify(galleryUrls),
        defaultSize,
        payload.isFeatured ? 1 : 0,
      ]
    );

    const productId = result.insertId;
    const variantsInput =
      Array.isArray(payload.variants) && payload.variants.length > 0
        ? payload.variants
        : [{ size: defaultSize, color: payload.color || 'Washed Black', stock: payload.stock ?? 10 }];

    for (let i = 0; i < variantsInput.length; i += 1) {
      const v = normalizeVariantInput(variantsInput[i], i, skuPrefix, defaultSize);
      await conn.execute(
        `INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, price_override, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [productId, v.sku, v.size, v.color, v.colorHex, v.stock, v.priceOverride]
      );
    }

    return productId;
  });

  return getProductByIdentifier(db, createdId, options);
}

export async function updateProduct(db, id, payload, options = {}) {
  const productId = parsePositiveInt(id, 'id');
  const existing = await getProductByIdentifier(db, productId, options);

  const updates = [];
  const params = [];

  if (payload.categoryId !== undefined || payload.category !== undefined) {
    const category = await resolveCategory(db, payload);
    updates.push('category_id = ?');
    params.push(category.id);
  }

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2 || name.length > 150) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El nombre debe tener entre 2 y 150 caracteres');
    }
    updates.push('name = ?');
    params.push(name);
  }

  if (payload.slug !== undefined) {
    const slug = normalizeSlug(payload.slug);
    if (!slug) throw new AppError(400, 'VALIDATION_ERROR', 'El slug no puede estar vacío');
    updates.push('slug = ?');
    params.push(slug);
  }

  const nextType = payload.productType ?? payload.product_type;
  if (nextType !== undefined) {
    if (!VALID_PRODUCT_TYPES.includes(nextType)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'productType inválido');
    }
    updates.push('product_type = ?');
    params.push(nextType);
  }

  if (payload.price !== undefined) {
    const price = Number(payload.price);
    if (Number.isNaN(price) || price <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El precio debe ser mayor a 0');
    }
    updates.push('price = ?');
    params.push(price);
  }

  const optionalTextFields = [
    ['subtitle', 'subtitle'],
    ['description', 'description'],
    ['brand', 'brand'],
    ['material', 'material'],
    ['fit', 'fit'],
    ['badge', 'badge'],
    ['defaultSize', 'default_size'],
  ];

  for (const [key, column] of optionalTextFields) {
    if (payload[key] !== undefined) {
      updates.push(`${column} = ?`);
      params.push(payload[key] === null ? null : String(payload[key]).trim());
    }
  }

  const nextImage = payload.imageUrl ?? payload.image;
  if (nextImage !== undefined) {
    if (!String(nextImage).trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'imageUrl no puede estar vacío');
    }
    updates.push('image_url = ?');
    params.push(String(nextImage).trim());
  }

  if (payload.compareAtPrice !== undefined) {
    updates.push('compare_at_price = ?');
    params.push(payload.compareAtPrice === null ? null : Number(payload.compareAtPrice));
  }

  if (payload.isFeatured !== undefined) {
    updates.push('is_featured = ?');
    params.push(payload.isFeatured ? 1 : 0);
  }

  if (payload.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(payload.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(productId);
  await db.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
  return getProductByIdentifier(db, productId, options);
}

export async function deleteProduct(db, id, { hard = false } = {}) {
  const productId = parsePositiveInt(id, 'id');
  await getProductByIdentifier(db, productId);

  if (hard) {
    await db.execute('DELETE FROM products WHERE id = ?', [productId]);
    return { deleted: true, hard: true, id: productId };
  }

  await db.execute('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
  return { deleted: true, hard: false, id: productId };
}

export async function addProductVariant(db, productIdParam, payload, options = {}) {
  const productId = parsePositiveInt(productIdParam, 'productId');
  const product = await getProductByIdentifier(db, productId);

  const variant = normalizeVariantInput(
    payload,
    product.variants.length,
    product.skuPrefix,
    product.defaultSize
  );

  await db.execute(
    `INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, price_override, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      productId,
      variant.sku,
      variant.size,
      variant.color,
      variant.colorHex,
      variant.stock,
      variant.priceOverride,
    ]
  );

  return getProductByIdentifier(db, productId, options);
}

export async function updateVariantStock(db, productIdParam, variantIdParam, payload) {
  const productId = parsePositiveInt(productIdParam, 'productId');
  const variantId = parsePositiveInt(variantIdParam, 'variantId');

  const [rows] = await db.execute(
    'SELECT id, product_id, sku, size, color, stock FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1',
    [variantId, productId]
  );

  if (rows.length === 0) {
    throw new AppError(
      404,
      'VARIANT_NOT_FOUND',
      `Variante ${variantId} no encontrada para el producto ${productId}`
    );
  }

  const currentStock = Number(rows[0].stock);
  let nextStock;

  if (payload.stock !== undefined) {
    nextStock = Number(payload.stock);
  } else if (payload.delta !== undefined) {
    nextStock = currentStock + Number(payload.delta);
  } else {
    throw new AppError(400, 'VALIDATION_ERROR', 'Debes enviar "stock" o "delta"');
  }

  if (!Number.isInteger(nextStock) || nextStock < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El stock resultante debe ser un entero >= 0');
  }

  await db.execute('UPDATE product_variants SET stock = ? WHERE id = ?', [nextStock, variantId]);

  return {
    id: variantId,
    productId,
    sku: rows[0].sku,
    size: rows[0].size,
    color: rows[0].color,
    previousStock: currentStock,
    stock: nextStock,
  };
}
