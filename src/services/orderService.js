import crypto from 'node:crypto';
import { withTransaction } from '../config/database.js';
import {
  AppError,
  isValidEmail,
  parsePositiveInt,
  throwValidationErrors,
} from '../middlewares/validate.js';

const VALID_PAYMENT_METHODS = ['card', 'transfer', 'mercadopago', 'cash'];
const VALID_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
];

function generateOrderNumber() {
  const randomDigits = crypto.randomInt(100000, 999999);
  return `DICH-${randomDigits}`;
}

function mapOrderRow(row, itemRows = []) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingPostalCode: row.shipping_postal_code,
    promoCode: row.promo_code,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    shippingCost: Number(row.shipping_cost),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    notes: row.notes,
    items: itemRows.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.product_name,
      sku: item.sku,
      size: item.size,
      color: item.color,
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createOrder(db, payload, authUser = null) {
  const errors = [];

  const customerName = typeof payload?.customerName === 'string' ? payload.customerName.trim() : '';
  const customerEmail =
    typeof payload?.customerEmail === 'string' ? payload.customerEmail.trim().toLowerCase() : '';
  const customerPhone =
    typeof payload?.customerPhone === 'string' ? payload.customerPhone.trim() : null;
  const shippingAddress =
    typeof payload?.shippingAddress === 'string' ? payload.shippingAddress.trim() : '';
  const shippingCity = typeof payload?.shippingCity === 'string' ? payload.shippingCity.trim() : '';
  const shippingPostalCode =
    typeof payload?.shippingPostalCode === 'string' ? payload.shippingPostalCode.trim() : null;
  const paymentMethod = payload?.paymentMethod || 'card';
  const promoCodeInput =
    typeof payload?.promoCode === 'string' && payload.promoCode.trim()
      ? payload.promoCode.trim().toUpperCase()
      : null;
  const items = Array.isArray(payload?.items) ? payload.items : [];

  if (customerName.length < 2) {
    errors.push({ field: 'customerName', message: 'El nombre del cliente es obligatorio' });
  }
  if (!isValidEmail(customerEmail)) {
    errors.push({ field: 'customerEmail', message: 'El email del cliente no es válido' });
  }
  if (shippingAddress.length < 4) {
    errors.push({ field: 'shippingAddress', message: 'La dirección de envío es obligatoria' });
  }
  if (shippingCity.length < 2) {
    errors.push({ field: 'shippingCity', message: 'La ciudad de envío es obligatoria' });
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push({
      field: 'paymentMethod',
      message: `Método de pago inválido. Permitidos: ${VALID_PAYMENT_METHODS.join(', ')}`,
    });
  }
  if (items.length === 0) {
    errors.push({ field: 'items', message: 'La orden debe contener al menos un producto' });
  }

  items.forEach((item, idx) => {
    const qty = Number(item?.quantity ?? item?.qty);
    if (!item?.productId && !item?.slug && !item?.variantId) {
      errors.push({
        field: `items[${idx}]`,
        message: 'Cada ítem debe indicar variantId, productId o slug',
      });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      errors.push({
        field: `items[${idx}].quantity`,
        message: 'La cantidad debe ser un entero mayor a 0',
      });
    }
  });

  throwValidationErrors(errors);

  const createdOrderId = await withTransaction(db, async (conn) => {
    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity ?? item.qty);
      let rows;

      if (item.variantId) {
        [rows] = await conn.execute(
          `SELECT pv.*, p.name AS product_name, p.price AS base_price, p.is_active AS product_active
           FROM product_variants pv
           INNER JOIN products p ON p.id = pv.product_id
           WHERE pv.id = ?
           LIMIT 1 FOR UPDATE`,
          [Number(item.variantId)]
        );
      } else {
        const isNumericProduct =
          item.productId !== undefined && /^\d+$/.test(String(item.productId));
        const lookupCol = isNumericProduct ? 'p.id' : 'p.slug';
        const lookupVal = isNumericProduct
          ? Number(item.productId)
          : String(item.slug || item.productId).trim().toLowerCase();
        const requestedSize = item.size ? String(item.size).trim() : null;
        const requestedColor = item.color ? String(item.color).trim() : null;

        const sizeFilter = requestedSize ? 'AND pv.size = ?' : '';
        const colorFilter = requestedColor ? 'AND pv.color = ?' : '';
        const queryParams = [lookupVal];
        if (requestedSize) queryParams.push(requestedSize);
        if (requestedColor) queryParams.push(requestedColor);

        [rows] = await conn.execute(
          `SELECT pv.*, p.name AS product_name, p.price AS base_price, p.is_active AS product_active
           FROM product_variants pv
           INNER JOIN products p ON p.id = pv.product_id
           WHERE ${lookupCol} = ? AND pv.is_active = 1 ${sizeFilter} ${colorFilter}
           ORDER BY (pv.size = p.default_size) DESC, pv.id ASC
           LIMIT 1 FOR UPDATE`,
          queryParams
        );
      }

      if (rows.length === 0) {
        throw new AppError(
          404,
          'PRODUCT_VARIANT_NOT_FOUND',
          `No se encontró el producto o talle solicitado (${item.slug || item.productId || item.variantId}${item.size ? ` / ${item.size}` : ''})`
        );
      }

      const variant = rows[0];
      if (!variant.product_active || !variant.is_active) {
        throw new AppError(
          400,
          'PRODUCT_UNAVAILABLE',
          `El producto "${variant.product_name}" no está disponible actualmente`
        );
      }

      if (Number(variant.stock) < quantity) {
        throw new AppError(
          409,
          'INSUFFICIENT_STOCK',
          `Stock insuficiente para "${variant.product_name}" (talle ${variant.size}). Disponible: ${variant.stock}, solicitado: ${quantity}`,
          {
            productName: variant.product_name,
            size: variant.size,
            availableStock: Number(variant.stock),
            requestedQuantity: quantity,
          }
        );
      }

      const unitPrice =
        variant.price_override !== null && variant.price_override !== undefined
          ? Number(variant.price_override)
          : Number(variant.base_price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;

      preparedItems.push({
        productId: variant.product_id,
        variantId: variant.id,
        productName: variant.product_name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        unitPrice,
        quantity,
        lineTotal,
      });
    }

    let promoCodeId = null;
    let appliedPromoCode = null;
    let discountAmount = 0;

    if (promoCodeInput) {
      const [promoRows] = await conn.execute(
        'SELECT * FROM promo_codes WHERE code = ? LIMIT 1 FOR UPDATE',
        [promoCodeInput]
      );

      if (promoRows.length === 0) {
        throw new AppError(404, 'PROMO_NOT_FOUND', `Código promocional "${promoCodeInput}" inválido`);
      }

      const promo = promoRows[0];
      if (!promo.is_active) {
        throw new AppError(400, 'PROMO_INACTIVE', `El código "${promoCodeInput}" no está activo`);
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        throw new AppError(400, 'PROMO_EXPIRED', `El código "${promoCodeInput}" expiró`);
      }
      if (promo.max_uses !== null && Number(promo.used_count) >= Number(promo.max_uses)) {
        throw new AppError(
          400,
          'PROMO_MAX_USES',
          `El código "${promoCodeInput}" alcanzó el límite de usos`
        );
      }
      if (subtotal < Number(promo.min_order_amount)) {
        throw new AppError(
          400,
          'PROMO_MIN_ORDER',
          `El código "${promoCodeInput}" requiere compra mínima de $${Number(promo.min_order_amount)}`
        );
      }

      promoCodeId = promo.id;
      appliedPromoCode = promo.code;

      const discountValue = Number(promo.discount_value);
      discountAmount =
        promo.discount_type === 'percentage'
          ? Math.round(subtotal * (discountValue / 100) * 100) / 100
          : Math.min(subtotal, discountValue);

      await conn.execute('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [
        promo.id,
      ]);
    }

    const shippingCost = 0;
    const total = Math.max(0, Math.round((subtotal - discountAmount + shippingCost) * 100) / 100);
    const orderNumber = generateOrderNumber();

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (
         order_number, user_id, customer_name, customer_email, customer_phone,
         shipping_address, shipping_city, shipping_postal_code,
         promo_code_id, promo_code, subtotal, discount_amount, shipping_cost, total,
         payment_method, status, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        orderNumber,
        authUser?.id ?? null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        promoCodeId,
        appliedPromoCode,
        subtotal,
        discountAmount,
        shippingCost,
        total,
        paymentMethod,
        payload.notes ? String(payload.notes).trim() : null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of preparedItems) {
      await conn.execute(
        `INSERT INTO order_items (
           order_id, product_id, variant_id, product_name, sku, size, color,
           unit_price, quantity, line_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.sku,
          item.size,
          item.color,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );

      await conn.execute('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [
        item.quantity,
        item.variantId,
      ]);
    }

    return orderId;
  });

  return getOrderByIdentifier(db, createdOrderId);
}

export async function getOrderByIdentifier(db, identifier) {
  const isNumeric = /^\d+$/.test(String(identifier));
  const [orderRows] = await db.execute(
    `SELECT * FROM orders WHERE ${isNumeric ? 'id = ?' : 'order_number = ?'} LIMIT 1`,
    [isNumeric ? Number(identifier) : String(identifier).trim().toUpperCase()]
  );

  if (orderRows.length === 0) {
    throw new AppError(404, 'ORDER_NOT_FOUND', `Orden "${identifier}" no encontrada`);
  }

  const order = orderRows[0];
  const [itemRows] = await db.execute(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
    [order.id]
  );

  return mapOrderRow(order, itemRows);
}

export async function listOrders(db, query = {}) {
  const conditions = [];
  const params = [];

  if (query.status) {
    if (!VALID_ORDER_STATUSES.includes(query.status)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Estado de orden inválido');
    }
    conditions.push('status = ?');
    params.push(query.status);
  }

  if (query.email) {
    conditions.push('customer_email = ?');
    params.push(String(query.email).trim().toLowerCase());
  }

  if (query.userId) {
    conditions.push('user_id = ?');
    params.push(Number(query.userId));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '20', 10) || 20));
  const offset = (page - 1) * limit;

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM orders ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [orders] = await db.execute(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  if (orders.length === 0) {
    return { items: [], pagination: { page, limit, total, totalPages: 1 } };
  }

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map(() => '?').join(', ');
  const [allItems] = await db.execute(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
    orderIds
  );

  const grouped = new Map();
  for (const item of allItems) {
    if (!grouped.has(item.order_id)) grouped.set(item.order_id, []);
    grouped.get(item.order_id).push(item);
  }

  return {
    items: orders.map((order) => mapOrderRow(order, grouped.get(order.id) || [])),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function updateOrderStatus(db, id, status) {
  const orderId = parsePositiveInt(id, 'id');
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Estado inválido "${status}". Valores permitidos: ${VALID_ORDER_STATUSES.join(', ')}`
    );
  }

  await withTransaction(db, async (conn) => {
    const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ? LIMIT 1 FOR UPDATE', [
      orderId,
    ]);
    if (rows.length === 0) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Orden ${orderId} no encontrada`);
    }

    const currentOrder = rows[0];
    if (currentOrder.status === status) {
      return;
    }

    // Si la orden se cancela desde un estado activo, se devuelve el stock reservado.
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      const [orderItems] = await conn.execute(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );
      for (const item of orderItems) {
        if (item.variant_id) {
          await conn.execute('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [
            item.quantity,
            item.variant_id,
          ]);
        }
      }
    }

    await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  });

  return getOrderByIdentifier(db, orderId);
}
