/**
 * Test double en memoria compatible con el pool de mysql2/promise.
 * Simula tablas, consultas filtradas, transacciones (commit/rollback) y errores MySQL.
 */
export function createMockDb({ disconnected = false } = {}) {
  const now = () => new Date().toISOString();

  let state = {
    nextIds: {
      categories: 7,
      products: 7,
      product_variants: 13,
      users: 3,
      promo_codes: 4,
      orders: 1,
      order_items: 1,
      newsletter_subscribers: 1,
      contact_messages: 1,
    },
    categories: [
      {
        id: 1,
        slug: 'hoodies',
        name: 'Hoodies & Buzos',
        product_type: 'apparel',
        description: 'Buzos y hoodies heavyweight 480GSM de corte boxy urbano',
        display_order: 1,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 2,
        slug: 'pants',
        name: 'Pantalones & Cargos',
        product_type: 'apparel',
        description: 'Pantalones parachute cargo y denim raw',
        display_order: 2,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 3,
        slug: 'tees',
        name: 'Remeras & Graphic Tees',
        product_type: 'apparel',
        description: 'Remeras oversized 300GSM',
        display_order: 3,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 4,
        slug: 'outerwear',
        name: 'Camperas & Outerwear',
        product_type: 'apparel',
        description: 'Camperas bomber y equipamiento urbano',
        display_order: 4,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 5,
        slug: 'sneakers',
        name: 'Calzado Urbano & Sneakers',
        product_type: 'footwear',
        description: 'Zapatillas low-top, runners y botas urbanas',
        display_order: 5,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 6,
        slug: 'accessories',
        name: 'Accesorios Urbanos',
        product_type: 'accessory',
        description: 'Gorras, bolsos y beanies',
        display_order: 6,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
    ],
    products: [
      {
        id: 1,
        slug: 'ld-hoodie-01',
        sku_prefix: 'LD-HD-01',
        category_id: 1,
        product_type: 'apparel',
        name: 'L&D BOXY HEAVYWEIGHT HOODIE',
        subtitle: '480GSM Washed Black French Terry · Drop Shoulder',
        description: 'Boxy cropped silhouette from custom 480GSM organic French terry.',
        brand: 'L&D',
        gender: 'unisex',
        material: '480GSM Organic French Terry Cotton',
        fit: 'Boxy Street Fit',
        price: 110,
        compare_at_price: 130,
        badge: 'AVAILABLE 28/250',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1556821840-3a63f95609a7']),
        default_size: 'L',
        is_featured: 1,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 2,
        slug: 'ld-cargo-02',
        sku_prefix: 'LD-CG-02',
        category_id: 2,
        product_type: 'apparel',
        name: 'PARACHUTE CARGO PANTS V2',
        subtitle: 'Technical Cotton-Nylon Ripstop · 8 Utility Pockets',
        description: 'Articulated knee pleats and adjustable ankle toggles.',
        brand: 'L&D',
        gender: 'unisex',
        material: 'Technical Cotton-Nylon Ripstop',
        fit: 'Relaxed Stacked Fit',
        price: 135,
        compare_at_price: 155,
        badge: 'AVAILABLE 19/250',
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80']),
        default_size: 'M',
        is_featured: 1,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 3,
        slug: 'ld-sneaker-05',
        sku_prefix: 'LD-SN-05',
        category_id: 5,
        product_type: 'footwear',
        name: 'L&D LOW-TOP SNEAKER "CONCRETE"',
        subtitle: 'Full-Grain Leather & Suede · Sculpted Cup Sole',
        description: 'Hand-lasted low-top skate & street sneaker.',
        brand: 'L&D',
        gender: 'unisex',
        material: 'Full-Grain Leather & Suede',
        fit: 'True to Size',
        price: 165,
        compare_at_price: 190,
        badge: 'AVAILABLE 15/250',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff']),
        default_size: 'US 9.5',
        is_featured: 1,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 4,
        slug: 'ld-runner-07',
        sku_prefix: 'LD-RN-07',
        category_id: 5,
        product_type: 'footwear',
        name: 'L&D RUNNER 02 "ASPHALT"',
        subtitle: 'Suede & Technical Ripstop Mesh · Dual-Density Midsole',
        description: 'Chunky urban runner with brushed suede overlays.',
        brand: 'L&D',
        gender: 'unisex',
        material: 'Suede & Ballistic Mesh',
        fit: 'True to Size',
        price: 185,
        compare_at_price: null,
        badge: 'NEW DROP 04',
        image_url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb']),
        default_size: 'US 10',
        is_featured: 1,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 5,
        slug: 'ld-bomber-04',
        sku_prefix: 'LD-BM-04',
        category_id: 4,
        product_type: 'apparel',
        name: 'DISTRESSED VARSITY BOMBER',
        subtitle: 'Heavyweight Twill & Chenille Patches',
        description: 'Oversized cropped varsity bomber jacket.',
        brand: 'L&D',
        gender: 'unisex',
        material: 'Heavyweight Cotton Twill',
        fit: 'Oversized Cropped',
        price: 210,
        compare_at_price: 245,
        badge: 'AVAILABLE 12/250',
        image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1591047139829-d91aecb6caea']),
        default_size: 'L',
        is_featured: 0,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 6,
        slug: 'ld-cap-10',
        sku_prefix: 'LD-CP-10',
        category_id: 6,
        product_type: 'accessory',
        name: 'L&D TECHNICAL 6-PANEL CAP',
        subtitle: 'Water-Repellent Nylon · Embroidered Logo',
        description: 'Gorra técnica urbana de 6 paneles.',
        brand: 'L&D',
        gender: 'unisex',
        material: '100% Water-Repellent Nylon',
        fit: 'Adjustable One Size',
        price: 42,
        compare_at_price: null,
        badge: 'IN STOCK',
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
        gallery_urls: JSON.stringify(['https://images.unsplash.com/photo-1588850561407-ed78c282e89b']),
        default_size: 'ONE SIZE',
        is_featured: 0,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
    ],
    product_variants: [
      { id: 1, product_id: 1, sku: 'LD-HD-01-BLK-M', size: 'M', color: 'Washed Black', color_hex: '#141414', stock: 8, price_override: null, is_active: 1 },
      { id: 2, product_id: 1, sku: 'LD-HD-01-BLK-L', size: 'L', color: 'Washed Black', color_hex: '#141414', stock: 9, price_override: null, is_active: 1 },
      { id: 3, product_id: 2, sku: 'LD-CG-02-OLI-M', size: 'M', color: 'Olive Charcoal', color_hex: '#2F332D', stock: 7, price_override: null, is_active: 1 },
      { id: 4, product_id: 2, sku: 'LD-CG-02-OLI-L', size: 'L', color: 'Olive Charcoal', color_hex: '#2F332D', stock: 5, price_override: null, is_active: 1 },
      { id: 5, product_id: 3, sku: 'LD-SN-05-CON-90', size: 'US 9', color: 'Concrete Crimson', color_hex: '#D92B2B', stock: 3, price_override: null, is_active: 1 },
      { id: 6, product_id: 3, sku: 'LD-SN-05-CON-95', size: 'US 9.5', color: 'Concrete Crimson', color_hex: '#D92B2B', stock: 4, price_override: null, is_active: 1 },
      { id: 7, product_id: 3, sku: 'LD-SN-05-CON-100', size: 'US 10', color: 'Concrete Crimson', color_hex: '#D92B2B', stock: 2, price_override: null, is_active: 1 },
      { id: 8, product_id: 4, sku: 'LD-RN-07-ASP-100', size: 'US 10', color: 'Asphalt Grey', color_hex: '#6E7275', stock: 6, price_override: null, is_active: 1 },
      { id: 9, product_id: 5, sku: 'LD-BM-04-BLK-L', size: 'L', color: 'Distressed Black', color_hex: '#111111', stock: 4, price_override: null, is_active: 1 },
      { id: 10, product_id: 6, sku: 'LD-CP-10-BLK-OS', size: 'ONE SIZE', color: 'Onyx Nylon', color_hex: '#121212', stock: 25, price_override: null, is_active: 1 },
    ],
    users: [
      {
        id: 1,
        first_name: 'Admin',
        last_name: 'L&D',
        email: 'admin@ldstore.com',
        password_hash: '$2b$10$z1TOMuLkMMg1jwltpov3k.u0Tl9O/35Op4H7lleB2FglaT90EmZyO',
        phone: '+54 11 5555-0100',
        role: 'admin',
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: 2,
        first_name: 'Lucas',
        last_name: 'Urbano',
        email: 'cliente@ldstore.com',
        password_hash: '$2b$10$ZeCDsZawmvM5laAlltICV.FhVzVRpn9no5u5cgOIv/4oqQkKfNYjS',
        phone: '+54 11 5555-0199',
        role: 'customer',
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      },
    ],
    promo_codes: [
      {
        id: 1,
        code: 'FIRST15',
        description: '15% de descuento en tu primera compra',
        discount_type: 'percentage',
        discount_value: 15,
        min_order_amount: 0,
        max_uses: null,
        used_count: 0,
        is_active: 1,
        expires_at: null,
      },
      {
        id: 2,
        code: 'URBAN10',
        description: '10% de descuento en indumentaria urbana',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 50,
        max_uses: 500,
        used_count: 0,
        is_active: 1,
        expires_at: null,
      },
      {
        id: 3,
        code: 'SNEAKER20',
        description: '$20 de descuento en compras >= $150',
        discount_type: 'fixed',
        discount_value: 20,
        min_order_amount: 150,
        max_uses: 200,
        used_count: 0,
        is_active: 1,
        expires_at: null,
      },
    ],
    orders: [],
    order_items: [],
    newsletter_subscribers: [],
    contact_messages: [],
  };

  function dupError(msg = 'Duplicate entry') {
    const err = new Error(msg);
    err.code = 'ER_DUP_ENTRY';
    return err;
  }

  function nextId(table) {
    const id = state.nextIds[table];
    state.nextIds[table] += 1;
    return id;
  }

  async function execute(rawSql, params = []) {
    if (disconnected) {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:3306');
      err.code = 'ECONNREFUSED';
      throw err;
    }

    const sql = rawSql.replace(/\s+/g, ' ').trim();
    let pIdx = 0;
    const nextParam = () => params[pIdx++];

    // Health check
    if (sql === 'SELECT 1 AS ok') {
      return [[{ ok: 1 }], []];
    }

    // CATEGORIES
    if (sql.includes('FROM categories c') && sql.includes('LEFT JOIN products p')) {
      let rows = [...state.categories];
      if (sql.includes('c.is_active = 1')) rows = rows.filter((c) => c.is_active === 1);
      if (sql.includes('c.product_type = ?')) {
        const type = nextParam();
        rows = rows.filter((c) => c.product_type === type);
      }
      if (sql.includes('WHERE c.id = ?')) {
        const id = nextParam();
        rows = rows.filter((c) => c.id === id);
      } else if (sql.includes('WHERE c.slug = ?')) {
        const slug = nextParam();
        rows = rows.filter((c) => c.slug === slug);
      }
      rows.sort((a, b) => a.display_order - b.display_order || a.id - b.id);
      const mapped = rows.map((c) => ({
        ...c,
        product_count: state.products.filter((p) => p.category_id === c.id && p.is_active === 1).length,
      }));
      return [mapped, []];
    }

    if (sql.startsWith('SELECT id, product_type FROM categories WHERE')) {
      const val = nextParam();
      const found = sql.includes('id = ?')
        ? state.categories.find((c) => c.id === val)
        : state.categories.find((c) => c.slug === val);
      return [found ? [{ id: found.id, product_type: found.product_type }] : [], []];
    }

    if (sql.startsWith('INSERT INTO categories')) {
      const [slug, name, product_type, description, display_order] = params;
      if (state.categories.some((c) => c.slug === slug)) throw dupError();
      const id = nextId('categories');
      state.categories.push({
        id,
        slug,
        name,
        product_type,
        description,
        display_order,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      });
      return [{ insertId: id }, []];
    }

    if (sql.startsWith('UPDATE categories SET')) {
      const id = params[params.length - 1];
      const cat = state.categories.find((c) => c.id === id);
      if (!cat) return [{ affectedRows: 0 }, []];
      const setClause = sql.match(/SET (.+) WHERE id = \?/)?.[1] || '';
      const assignments = setClause.split(',').map((s) => s.trim());
      assignments.forEach((assign, i) => {
        const col = assign.split('=')[0].trim();
        cat[col] = params[i];
      });
      cat.updated_at = now();
      return [{ affectedRows: 1 }, []];
    }

    if (sql === 'SELECT COUNT(*) AS total FROM products WHERE category_id = ?') {
      const categoryId = nextParam();
      const total = state.products.filter((p) => p.category_id === categoryId).length;
      return [[{ total }], []];
    }

    if (sql === 'DELETE FROM categories WHERE id = ?') {
      const id = nextParam();
      const idx = state.categories.findIndex((c) => c.id === id);
      if (idx === -1) return [{ affectedRows: 0 }, []];
      state.categories.splice(idx, 1);
      return [{ affectedRows: 1 }, []];
    }

    // PRODUCTS
    if (sql.includes('FROM products p INNER JOIN categories c')) {
      let rows = state.products.map((p) => {
        const cat = state.categories.find((c) => c.id === p.category_id);
        return {
          ...p,
          category_slug: cat?.slug,
          category_name: cat?.name,
        };
      });

      if (sql.includes('WHERE p.id = ?')) {
        const id = nextParam();
        return [rows.filter((r) => r.id === id).slice(0, 1), []];
      }
      if (sql.includes('WHERE p.slug = ?')) {
        const slug = nextParam();
        return [rows.filter((r) => r.slug === slug).slice(0, 1), []];
      }

      if (sql.includes('p.is_active = 1')) rows = rows.filter((p) => p.is_active === 1);
      if (sql.includes('p.category_id = ?')) {
        const catId = nextParam();
        rows = rows.filter((p) => p.category_id === catId);
      }
      if (sql.includes('c.slug = ?')) {
        const catSlug = nextParam();
        rows = rows.filter((p) => p.category_slug === catSlug);
      }
      if (sql.includes('p.product_type = ?')) {
        const type = nextParam();
        rows = rows.filter((p) => p.product_type === type);
      }
      if (sql.includes('p.gender = ?')) {
        const gender = nextParam();
        rows = rows.filter((p) => p.gender === gender);
      }
      if (sql.includes('p.is_featured = ?')) {
        const featured = nextParam();
        rows = rows.filter((p) => p.is_featured === featured);
      }
      if (sql.includes('p.price >= ?')) {
        const minPrice = nextParam();
        rows = rows.filter((p) => p.price >= minPrice);
      }
      if (sql.includes('p.price <= ?')) {
        const maxPrice = nextParam();
        rows = rows.filter((p) => p.price <= maxPrice);
      }
      if (sql.includes('pv.size = ?')) {
        const size = nextParam();
        rows = rows.filter((p) =>
          state.product_variants.some(
            (v) => v.product_id === p.id && v.is_active === 1 && v.size === size
          )
        );
      }
      if (sql.includes('pv.stock > 0')) {
        rows = rows.filter((p) =>
          state.product_variants.some(
            (v) => v.product_id === p.id && v.is_active === 1 && v.stock > 0
          )
        );
      }
      if (sql.includes('p.name LIKE ?')) {
        const term = nextParam().replace(/%/g, '').toLowerCase();
        nextParam();
        nextParam();
        nextParam();
        nextParam();
        rows = rows.filter((p) =>
          [p.name, p.subtitle, p.description, p.material, p.brand]
            .filter(Boolean)
            .some((val) => val.toLowerCase().includes(term))
        );
      }

      if (sql.startsWith('SELECT COUNT(*) AS total')) {
        return [[{ total: rows.length }], []];
      }

      if (sql.includes('ORDER BY p.price ASC')) {
        rows.sort((a, b) => a.price - b.price || a.id - b.id);
      } else if (sql.includes('ORDER BY p.price DESC')) {
        rows.sort((a, b) => b.price - a.price || a.id - b.id);
      } else if (sql.includes('ORDER BY p.name ASC')) {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sql.includes('ORDER BY p.created_at DESC')) {
        rows.sort((a, b) => b.id - a.id);
      } else {
        rows.sort((a, b) => b.is_featured - a.is_featured || a.id - b.id);
      }

      const limitMatch = sql.match(/LIMIT (\d+) OFFSET (\d+)/);
      if (limitMatch) {
        const limit = Number(limitMatch[1]);
        const offset = Number(limitMatch[2]);
        rows = rows.slice(offset, offset + limit);
      }

      return [rows, []];
    }

    if (sql.includes('FROM product_variants WHERE product_id IN')) {
      const ids = new Set(params);
      const rows = state.product_variants.filter((v) => ids.has(v.product_id));
      return [rows, []];
    }

    if (sql.startsWith('INSERT INTO products')) {
      const [
        slug,
        sku_prefix,
        category_id,
        product_type,
        name,
        subtitle,
        description,
        brand,
        gender,
        material,
        fit,
        price,
        compare_at_price,
        badge,
        image_url,
        gallery_urls,
        default_size,
        is_featured,
      ] = params;
      if (state.products.some((p) => p.slug === slug || p.sku_prefix === sku_prefix)) {
        throw dupError();
      }
      const id = nextId('products');
      state.products.push({
        id,
        slug,
        sku_prefix,
        category_id,
        product_type,
        name,
        subtitle,
        description,
        brand,
        gender,
        material,
        fit,
        price,
        compare_at_price,
        badge,
        image_url,
        gallery_urls,
        default_size,
        is_featured,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      });
      return [{ insertId: id }, []];
    }

    if (sql.startsWith('UPDATE products SET is_active = 0 WHERE id = ?')) {
      const id = nextParam();
      const prod = state.products.find((p) => p.id === id);
      if (prod) prod.is_active = 0;
      return [{ affectedRows: prod ? 1 : 0 }, []];
    }

    if (sql.startsWith('UPDATE products SET')) {
      const id = params[params.length - 1];
      const prod = state.products.find((p) => p.id === id);
      if (!prod) return [{ affectedRows: 0 }, []];
      const setClause = sql.match(/SET (.+) WHERE id = \?/)?.[1] || '';
      const assignments = setClause.split(',').map((s) => s.trim());
      assignments.forEach((assign, i) => {
        const col = assign.split('=')[0].trim();
        prod[col] = params[i];
      });
      prod.updated_at = now();
      return [{ affectedRows: 1 }, []];
    }

    if (sql === 'DELETE FROM products WHERE id = ?') {
      const id = nextParam();
      state.products = state.products.filter((p) => p.id !== id);
      state.product_variants = state.product_variants.filter((v) => v.product_id !== id);
      return [{ affectedRows: 1 }, []];
    }

    // PRODUCT VARIANTS
    if (sql.startsWith('INSERT INTO product_variants')) {
      const [product_id, sku, size, color, color_hex, stock, price_override] = params;
      if (
        state.product_variants.some(
          (v) => v.sku === sku || (v.product_id === product_id && v.size === size && v.color === color)
        )
      ) {
        throw dupError();
      }
      const id = nextId('product_variants');
      state.product_variants.push({
        id,
        product_id,
        sku,
        size,
        color,
        color_hex,
        stock,
        price_override,
        is_active: 1,
      });
      return [{ insertId: id }, []];
    }

    if (sql.includes('FROM product_variants WHERE id = ? AND product_id = ?')) {
      const [variantId, productId] = params;
      const found = state.product_variants.find(
        (v) => v.id === variantId && v.product_id === productId
      );
      return [found ? [found] : [], []];
    }

    if (sql === 'UPDATE product_variants SET stock = ? WHERE id = ?') {
      const [stock, id] = params;
      const v = state.product_variants.find((item) => item.id === id);
      if (v) v.stock = stock;
      return [{ affectedRows: v ? 1 : 0 }, []];
    }

    if (sql === 'UPDATE product_variants SET stock = stock - ? WHERE id = ?') {
      const [qty, id] = params;
      const v = state.product_variants.find((item) => item.id === id);
      if (v) v.stock -= qty;
      return [{ affectedRows: v ? 1 : 0 }, []];
    }

    if (sql === 'UPDATE product_variants SET stock = stock + ? WHERE id = ?') {
      const [qty, id] = params;
      const v = state.product_variants.find((item) => item.id === id);
      if (v) v.stock += qty;
      return [{ affectedRows: v ? 1 : 0 }, []];
    }

    if (sql.includes('FROM product_variants pv INNER JOIN products p ON p.id = pv.product_id')) {
      let rows = state.product_variants.map((pv) => {
        const p = state.products.find((prod) => prod.id === pv.product_id);
        return {
          ...pv,
          product_name: p?.name,
          base_price: p?.price,
          product_active: p?.is_active,
          default_size: p?.default_size,
          p_slug: p?.slug,
        };
      });

      if (sql.includes('WHERE pv.id = ?')) {
        const id = nextParam();
        rows = rows.filter((r) => r.id === id);
      } else {
        const val = nextParam();
        if (sql.includes('WHERE p.id = ?')) {
          rows = rows.filter((r) => r.product_id === val);
        } else {
          rows = rows.filter((r) => r.p_slug === val);
        }
        rows = rows.filter((r) => r.is_active === 1);
        if (sql.includes('AND pv.size = ?')) {
          const size = nextParam();
          rows = rows.filter((r) => r.size === size);
        }
        if (sql.includes('AND pv.color = ?')) {
          const color = nextParam();
          rows = rows.filter((r) => r.color === color);
        }
        rows.sort((a, b) => {
          const aDef = a.size === a.default_size ? 1 : 0;
          const bDef = b.size === b.default_size ? 1 : 0;
          return bDef - aDef || a.id - b.id;
        });
      }

      return [rows.slice(0, 1), []];
    }

    // PROMO CODES
    if (sql.startsWith('SELECT * FROM promo_codes WHERE is_active = 1')) {
      return [state.promo_codes.filter((p) => p.is_active === 1), []];
    }
    if (sql.startsWith('SELECT * FROM promo_codes WHERE code = ?')) {
      const code = nextParam();
      const found = state.promo_codes.find((p) => p.code === code);
      return [found ? [found] : [], []];
    }
    if (sql.startsWith('SELECT * FROM promo_codes WHERE id = ?')) {
      const id = nextParam();
      const found = state.promo_codes.find((p) => p.id === id);
      return [found ? [found] : [], []];
    }
    if (sql.startsWith('INSERT INTO promo_codes')) {
      const [code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at] =
        params;
      if (state.promo_codes.some((p) => p.code === code)) throw dupError();
      const id = nextId('promo_codes');
      state.promo_codes.push({
        id,
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_uses,
        used_count: 0,
        is_active: 1,
        expires_at,
      });
      return [{ insertId: id }, []];
    }
    if (sql === 'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?') {
      const id = nextParam();
      const promo = state.promo_codes.find((p) => p.id === id);
      if (promo) promo.used_count += 1;
      return [{ affectedRows: promo ? 1 : 0 }, []];
    }

    // ORDERS & ORDER ITEMS
    if (sql.startsWith('INSERT INTO orders')) {
      const [
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        promo_code_id,
        promo_code,
        subtotal,
        discount_amount,
        shipping_cost,
        total,
        payment_method,
        notes,
      ] = params;
      const id = nextId('orders');
      state.orders.push({
        id,
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        promo_code_id,
        promo_code,
        subtotal,
        discount_amount,
        shipping_cost,
        total,
        payment_method,
        status: 'confirmed',
        notes,
        created_at: now(),
        updated_at: now(),
      });
      return [{ insertId: id }, []];
    }

    if (sql.startsWith('INSERT INTO order_items')) {
      const [order_id, product_id, variant_id, product_name, sku, size, color, unit_price, quantity, line_total] =
        params;
      const id = nextId('order_items');
      state.order_items.push({
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        sku,
        size,
        color,
        unit_price,
        quantity,
        line_total,
      });
      return [{ insertId: id }, []];
    }

    if (sql.startsWith('SELECT * FROM orders WHERE id = ?')) {
      const id = nextParam();
      const found = state.orders.find((o) => o.id === id);
      return [found ? [found] : [], []];
    }

    if (sql.startsWith('SELECT * FROM orders WHERE order_number = ?')) {
      const num = nextParam();
      const found = state.orders.find((o) => o.order_number === num);
      return [found ? [found] : [], []];
    }

    if (sql.startsWith('SELECT COUNT(*) AS total FROM orders') || sql.startsWith('SELECT * FROM orders')) {
      let rows = [...state.orders];
      if (sql.includes('status = ?')) {
        const status = nextParam();
        rows = rows.filter((o) => o.status === status);
      }
      if (sql.includes('customer_email = ?')) {
        const email = nextParam();
        rows = rows.filter((o) => o.customer_email === email);
      }
      if (sql.includes('user_id = ?')) {
        const uid = nextParam();
        rows = rows.filter((o) => o.user_id === uid);
      }
      if (sql.startsWith('SELECT COUNT(*)')) {
        return [[{ total: rows.length }], []];
      }
      rows.sort((a, b) => b.id - a.id);
      return [rows, []];
    }

    if (sql.startsWith('SELECT * FROM order_items WHERE order_id = ?')) {
      const orderId = nextParam();
      return [state.order_items.filter((i) => i.order_id === orderId), []];
    }

    if (sql.startsWith('SELECT variant_id, quantity FROM order_items WHERE order_id = ?')) {
      const orderId = nextParam();
      return [state.order_items.filter((i) => i.order_id === orderId), []];
    }

    if (sql.startsWith('SELECT * FROM order_items WHERE order_id IN')) {
      const ids = new Set(params);
      return [state.order_items.filter((i) => ids.has(i.order_id)), []];
    }

    if (sql === 'UPDATE orders SET status = ? WHERE id = ?') {
      const [status, id] = params;
      const order = state.orders.find((o) => o.id === id);
      if (order) order.status = status;
      return [{ affectedRows: order ? 1 : 0 }, []];
    }

    // USERS & AUTH
    if (sql === 'SELECT id FROM users WHERE email = ? LIMIT 1') {
      const email = nextParam();
      const found = state.users.find((u) => u.email === email);
      return [found ? [{ id: found.id }] : [], []];
    }
    if (sql === 'SELECT * FROM users WHERE email = ? LIMIT 1') {
      const email = nextParam();
      const found = state.users.find((u) => u.email === email);
      return [found ? [found] : [], []];
    }
    if (sql.includes('FROM users WHERE id = ? LIMIT 1')) {
      const id = nextParam();
      const found = state.users.find((u) => u.id === id);
      return [found ? [found] : [], []];
    }
    if (sql.startsWith('INSERT INTO users')) {
      const [first_name, last_name, email, password_hash, phone] = params;
      if (state.users.some((u) => u.email === email)) throw dupError();
      const id = nextId('users');
      state.users.push({
        id,
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        role: 'customer',
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      });
      return [{ insertId: id }, []];
    }

    // NEWSLETTER
    if (sql === 'SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1') {
      const email = nextParam();
      const found = state.newsletter_subscribers.find((n) => n.email === email);
      return [found ? [found] : [], []];
    }
    if (sql === 'SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1') {
      const id = nextParam();
      const found = state.newsletter_subscribers.find((n) => n.id === id);
      return [found ? [found] : [], []];
    }
    if (sql.startsWith('INSERT INTO newsletter_subscribers')) {
      const [email, source] = params;
      const id = nextId('newsletter_subscribers');
      state.newsletter_subscribers.push({
        id,
        email,
        source,
        is_active: 1,
        subscribed_at: now(),
      });
      return [{ insertId: id }, []];
    }
    if (sql === 'UPDATE newsletter_subscribers SET is_active = 1, source = ? WHERE id = ?') {
      const [source, id] = params;
      const sub = state.newsletter_subscribers.find((n) => n.id === id);
      if (sub) {
        sub.is_active = 1;
        sub.source = source;
      }
      return [{ affectedRows: sub ? 1 : 0 }, []];
    }
    if (sql.startsWith('SELECT * FROM newsletter_subscribers WHERE is_active = 1')) {
      return [state.newsletter_subscribers.filter((n) => n.is_active === 1), []];
    }
    if (sql === 'UPDATE newsletter_subscribers SET is_active = 0 WHERE email = ? AND is_active = 1') {
      const email = nextParam();
      const sub = state.newsletter_subscribers.find((n) => n.email === email && n.is_active === 1);
      if (!sub) return [{ affectedRows: 0 }, []];
      sub.is_active = 0;
      return [{ affectedRows: 1 }, []];
    }

    // CONTACT MESSAGES
    if (sql.startsWith('INSERT INTO contact_messages')) {
      const [first_name, last_name, email, subject, message] = params;
      const id = nextId('contact_messages');
      state.contact_messages.push({
        id,
        first_name,
        last_name,
        email,
        subject,
        message,
        status: 'new',
        created_at: now(),
        updated_at: now(),
      });
      return [{ insertId: id }, []];
    }
    if (sql === 'SELECT * FROM contact_messages WHERE id = ? LIMIT 1') {
      const id = nextParam();
      const found = state.contact_messages.find((c) => c.id === id);
      return [found ? [found] : [], []];
    }
    if (sql.startsWith('SELECT * FROM contact_messages')) {
      let rows = [...state.contact_messages];
      if (sql.includes('status = ?')) {
        const status = nextParam();
        rows = rows.filter((c) => c.status === status);
      }
      rows.sort((a, b) => b.id - a.id);
      return [rows, []];
    }
    if (sql === 'UPDATE contact_messages SET status = ? WHERE id = ?') {
      const [status, id] = params;
      const msg = state.contact_messages.find((c) => c.id === id);
      if (!msg) return [{ affectedRows: 0 }, []];
      msg.status = status;
      msg.updated_at = now();
      return [{ affectedRows: 1 }, []];
    }

    throw new Error(`MockDB unhandled SQL: ${sql}`);
  }

  async function getConnection() {
    let snapshot = null;
    return {
      execute,
      async beginTransaction() {
        snapshot = structuredClone(state);
      },
      async commit() {
        snapshot = null;
      },
      async rollback() {
        if (snapshot) {
          state = snapshot;
          snapshot = null;
        }
      },
      release() {},
    };
  }

  return {
    execute,
    getConnection,
    getState: () => state,
  };
}
