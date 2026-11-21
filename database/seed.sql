-- ============================================================================
-- L&D STREETWEAR & FOOTWEAR — DATOS INICIALES (SEED)
-- Incluye indumentaria urbana, calzado urbano, variantes/tallaje,
-- códigos promocionales y usuarios de prueba.
-- ============================================================================

USE ld_store_db;

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. CATEGORÍAS
-- ----------------------------------------------------------------------------
INSERT INTO categories (slug, name, product_type, description, display_order, is_active)
VALUES
  ('hoodies', 'Hoodies & Buzos', 'apparel', 'Buzos y hoodies heavyweight 480GSM de corte boxy urbano', 1, 1),
  ('pants', 'Pantalones & Cargos', 'apparel', 'Pantalones parachute cargo, utility y denim raw de calce relajado', 2, 1),
  ('tees', 'Remeras & Graphic Tees', 'apparel', 'Remeras oversized 300GSM con lavado ácido y estampas brutalistas', 3, 1),
  ('outerwear', 'Camperas & Outerwear', 'apparel', 'Camperas bomber, chaquetas técnicas y equipamiento de abrigo', 4, 1),
  ('sneakers', 'Calzado Urbano & Sneakers', 'footwear', 'Zapatillas low-top, runners técnicos y botas urbanas de suela esculpida', 5, 1),
  ('accessories', 'Accesorios Urbanos', 'accessory', 'Gorras técnicas, bolsos Cordura y beanies de punto pesado', 6, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  product_type = VALUES(product_type),
  description = VALUES(description),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

-- ----------------------------------------------------------------------------
-- 2. PRODUCTOS (Indumentaria urbana + Calzado urbano + Accesorios)
-- ----------------------------------------------------------------------------
INSERT INTO products (
  slug, sku_prefix, category_id, product_type, name, subtitle, description,
  brand, gender, material, fit, price, compare_at_price, badge,
  image_url, gallery_urls, default_size, is_featured, is_active
)
VALUES
  (
    'ld-hoodie-01',
    'LD-HD-01',
    (SELECT id FROM categories WHERE slug = 'hoodies' LIMIT 1),
    'apparel',
    'L&D BOXY HEAVYWEIGHT HOODIE',
    '480GSM Washed Black French Terry · Drop Shoulder',
    'Cut in a boxy cropped silhouette from custom 480GSM organic French terry. Features vintage charcoal enzyme wash, double-lined hood, and puff-print L&D chest branding.',
    'L&D',
    'unisex',
    '480GSM Organic French Terry Cotton',
    'Boxy Street Fit',
    110.00,
    130.00,
    'AVAILABLE 28/250',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85'),
    'L',
    1,
    1
  ),
  (
    'ld-cargo-02',
    'LD-CG-02',
    (SELECT id FROM categories WHERE slug = 'pants' LIMIT 1),
    'apparel',
    'PARACHUTE CARGO PANTS V2',
    'Technical Cotton-Nylon Ripstop · 8 Utility Pockets',
    'Articulated knee pleats, adjustable ankle bungee toggles, and heavy-duty matte black hardware. Engineered for relaxed stacked draping over bulky sneakers.',
    'L&D',
    'unisex',
    'Technical Cotton-Nylon Ripstop',
    'Relaxed Stacked Fit',
    135.00,
    155.00,
    'AVAILABLE 19/250',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85'),
    'M',
    1,
    1
  ),
  (
    'ld-tee-03',
    'LD-TE-03',
    (SELECT id FROM categories WHERE slug = 'tees' LIMIT 1),
    'apparel',
    'ACID WASH GRAPHIC TEE',
    '300GSM Heavy Jersey · Brutalist Screenprint',
    'Sun-faded acid wash heavyweight cotton tee with thick high-ribbed collar and distressed neon-pink & white archive screenprint across chest and back.',
    'L&D',
    'unisex',
    '300GSM Combed Heavy Jersey',
    'Oversized Drop Shoulder',
    58.00,
    NULL,
    'AVAILABLE 42/250',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=85'),
    'L',
    1,
    1
  ),
  (
    'ld-bomber-04',
    'LD-BM-04',
    (SELECT id FROM categories WHERE slug = 'outerwear' LIMIT 1),
    'apparel',
    'DISTRESSED VARSITY BOMBER',
    'Heavyweight Twill & Chenille Patches · Quilted Lining',
    'Oversized cropped varsity bomber jacket featuring hand-distressed rib trims, custom chenille L&D emblems, two-way YKK® metal zipper, and satin diamond lining.',
    'L&D',
    'unisex',
    'Heavyweight Cotton Twill & Satin Lining',
    'Oversized Cropped',
    210.00,
    245.00,
    'AVAILABLE 12/250',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85'),
    'L',
    1,
    1
  ),
  (
    'ld-sneaker-05',
    'LD-SN-05',
    (SELECT id FROM categories WHERE slug = 'sneakers' LIMIT 1),
    'footwear',
    'L&D LOW-TOP SNEAKER "CONCRETE"',
    'Full-Grain Leather & Suede · Sculpted Cup Sole',
    'Hand-lasted low-top skate & street silhouette crafted with supple full-grain leather, hairy suede overlays, padded fat tongue, and custom L&D tread outsole.',
    'L&D',
    'unisex',
    'Full-Grain Leather, Suede & Rubber Cup Sole',
    'True to Size',
    165.00,
    190.00,
    'AVAILABLE 15/250',
    '/images/products/shoe-concrete.jpg',
    JSON_ARRAY('/images/products/shoe-concrete.jpg', '/images/products/sneakers-topdown.jpg'),
    'US 9.5',
    1,
    1
  ),
  (
    'ld-utility-06',
    'LD-UT-06',
    (SELECT id FROM categories WHERE slug = 'outerwear' LIMIT 1),
    'accessory',
    'UTILITY CROSSBODY BAG & BEANIE SET',
    'Cordura® Ballistic Sling + Ribbed Knit Beanie',
    'Two-piece tactical street bundle pairing a weatherproof 1000D Cordura® crossbody pouch with a heavyweight fisherman knit beanie with woven L&D label.',
    'L&D',
    'unisex',
    '1000D Ballistic Cordura® & Heavy Rib Knit',
    'Adjustable One Size',
    65.00,
    NULL,
    'AVAILABLE 34/250',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85'),
    'ONE SIZE',
    1,
    1
  ),
  (
    'ld-runner-07',
    'LD-RN-07',
    (SELECT id FROM categories WHERE slug = 'sneakers' LIMIT 1),
    'footwear',
    'L&D RUNNER 02 "ASPHALT"',
    'Suede & Technical Ripstop Mesh · Vibram-Style Midsole',
    'Zapatilla urbana de estética chunky runner con paneles de gamuza cepillada, malla respirable y entresuela de doble densidad diseñada para uso diario en asfalto.',
    'L&D',
    'unisex',
    'Suede, Ballistic Mesh & Dual-Density EVA',
    'True to Size',
    185.00,
    NULL,
    'NEW DROP 04',
    '/images/products/shoe-mostro.jpg',
    JSON_ARRAY('/images/products/shoe-mostro.jpg'),
    'US 10',
    1,
    1
  ),
  (
    'ld-boot-08',
    'LD-BT-08',
    (SELECT id FROM categories WHERE slug = 'sneakers' LIMIT 1),
    'footwear',
    'L&D MONOLITH HIGH-TOP BOOT',
    'Matte Calfskin & Heavy Lug Outsole · Side Zip',
    'Bota urbana caña alta de silueta arquitectónica con cuero vacuno mate, cierre lateral YKK® metálico y suela tractor de alta tracción.',
    'L&D',
    'unisex',
    'Matte Full-Grain Calfskin & Vulcanized Rubber',
    'Relaxed Toe Box',
    220.00,
    250.00,
    'LIMITED 10/100',
    '/images/products/shoe-xperks.jpg',
    JSON_ARRAY('/images/products/shoe-xperks.jpg'),
    'US 10',
    0,
    1
  ),
  (
    'ld-denim-09',
    'LD-DN-09',
    (SELECT id FROM categories WHERE slug = 'pants' LIMIT 1),
    'apparel',
    'RAW SELVEDGE CARPENTER DENIM',
    '14oz Indigo Denim · Triple Stitch & Hammer Loop',
    'Jean carpenter de calce amplio en denim crudo de 14 onzas con doble rodilla reforzada, costuras en contraste y herrajes grabados.',
    'L&D',
    'unisex',
    '14oz 100% Cotton Raw Denim',
    'Baggy Wide Fit',
    145.00,
    NULL,
    'ARCHIVE PIECE',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85'),
    'M',
    0,
    1
  ),
  (
    'ld-cap-10',
    'LD-CP-10',
    (SELECT id FROM categories WHERE slug = 'accessories' LIMIT 1),
    'accessory',
    'L&D TECHNICAL 6-PANEL CAP',
    'Water-Repellent Nylon · Embroidered Front Logo',
    'Gorra urbana de 6 paneles en nylon técnico repelente al agua con visera precurvada, bordado L&D en alta densidad y ajuste trasero con hebilla metálica.',
    'L&D',
    'unisex',
    '100% Water-Repellent Technical Nylon',
    'Adjustable One Size',
    42.00,
    NULL,
    'IN STOCK',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85',
    JSON_ARRAY('https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85'),
    'ONE SIZE',
    0,
    1
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  product_type = VALUES(product_type),
  name = VALUES(name),
  subtitle = VALUES(subtitle),
  description = VALUES(description),
  brand = VALUES(brand),
  material = VALUES(material),
  fit = VALUES(fit),
  price = VALUES(price),
  compare_at_price = VALUES(compare_at_price),
  badge = VALUES(badge),
  image_url = VALUES(image_url),
  gallery_urls = VALUES(gallery_urls),
  default_size = VALUES(default_size),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

-- ----------------------------------------------------------------------------
-- 3. VARIANTES Y STOCK POR TALLE Y COLOR
-- ----------------------------------------------------------------------------
INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, is_active)
VALUES
  -- Hoodie 01 (S, M, L, XL)
  ((SELECT id FROM products WHERE slug = 'ld-hoodie-01' LIMIT 1), 'LD-HD-01-BLK-S',  'S',  'Washed Black', '#141414', 6, 1),
  ((SELECT id FROM products WHERE slug = 'ld-hoodie-01' LIMIT 1), 'LD-HD-01-BLK-M',  'M',  'Washed Black', '#141414', 8, 1),
  ((SELECT id FROM products WHERE slug = 'ld-hoodie-01' LIMIT 1), 'LD-HD-01-BLK-L',  'L',  'Washed Black', '#141414', 9, 1),
  ((SELECT id FROM products WHERE slug = 'ld-hoodie-01' LIMIT 1), 'LD-HD-01-BLK-XL', 'XL', 'Washed Black', '#141414', 5, 1),

  -- Cargo Pants 02 (S, M, L, XL)
  ((SELECT id FROM products WHERE slug = 'ld-cargo-02' LIMIT 1), 'LD-CG-02-OLI-S',  'S',  'Olive Charcoal', '#2F332D', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-cargo-02' LIMIT 1), 'LD-CG-02-OLI-M',  'M',  'Olive Charcoal', '#2F332D', 7, 1),
  ((SELECT id FROM products WHERE slug = 'ld-cargo-02' LIMIT 1), 'LD-CG-02-OLI-L',  'L',  'Olive Charcoal', '#2F332D', 5, 1),
  ((SELECT id FROM products WHERE slug = 'ld-cargo-02' LIMIT 1), 'LD-CG-02-OLI-XL', 'XL', 'Olive Charcoal', '#2F332D', 3, 1),

  -- Graphic Tee 03 (S, M, L, XL)
  ((SELECT id FROM products WHERE slug = 'ld-tee-03' LIMIT 1), 'LD-TE-03-ACD-S',  'S',  'Acid Charcoal', '#262626', 10, 1),
  ((SELECT id FROM products WHERE slug = 'ld-tee-03' LIMIT 1), 'LD-TE-03-ACD-M',  'M',  'Acid Charcoal', '#262626', 12, 1),
  ((SELECT id FROM products WHERE slug = 'ld-tee-03' LIMIT 1), 'LD-TE-03-ACD-L',  'L',  'Acid Charcoal', '#262626', 12, 1),
  ((SELECT id FROM products WHERE slug = 'ld-tee-03' LIMIT 1), 'LD-TE-03-ACD-XL', 'XL', 'Acid Charcoal', '#262626', 8, 1),

  -- Varsity Bomber 04 (S, M, L, XL)
  ((SELECT id FROM products WHERE slug = 'ld-bomber-04' LIMIT 1), 'LD-BM-04-BLK-S',  'S',  'Distressed Black', '#111111', 2, 1),
  ((SELECT id FROM products WHERE slug = 'ld-bomber-04' LIMIT 1), 'LD-BM-04-BLK-M',  'M',  'Distressed Black', '#111111', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-bomber-04' LIMIT 1), 'LD-BM-04-BLK-L',  'L',  'Distressed Black', '#111111', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-bomber-04' LIMIT 1), 'LD-BM-04-BLK-XL', 'XL', 'Distressed Black', '#111111', 2, 1),

  -- Low-Top Sneaker "Concrete" 05 (US 8 - US 12)
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-80',  'US 8',   'Concrete Crimson', '#D92B2B', 2, 1),
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-90',  'US 9',   'Concrete Crimson', '#D92B2B', 3, 1),
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-95',  'US 9.5', 'Concrete Crimson', '#D92B2B', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-100', 'US 10',  'Concrete Crimson', '#D92B2B', 3, 1),
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-110', 'US 11',  'Concrete Crimson', '#D92B2B', 2, 1),
  ((SELECT id FROM products WHERE slug = 'ld-sneaker-05' LIMIT 1), 'LD-SN-05-CON-120', 'US 12',  'Concrete Crimson', '#D92B2B', 1, 1),

  -- Utility Bag & Beanie Set 06 (ONE SIZE)
  ((SELECT id FROM products WHERE slug = 'ld-utility-06' LIMIT 1), 'LD-UT-06-BLK-OS', 'ONE SIZE', 'Tactical Black', '#0A0A0A', 34, 1),

  -- Runner 02 "Asphalt" 07 (US 8 - US 12)
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-80',  'US 8',   'Asphalt Grey', '#6E7275', 3, 1),
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-90',  'US 9',   'Asphalt Grey', '#6E7275', 5, 1),
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-95',  'US 9.5', 'Asphalt Grey', '#6E7275', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-100', 'US 10',  'Asphalt Grey', '#6E7275', 6, 1),
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-110', 'US 11',  'Asphalt Grey', '#6E7275', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-runner-07' LIMIT 1), 'LD-RN-07-ASP-120', 'US 12',  'Asphalt Grey', '#6E7275', 2, 1),

  -- Monolith High-Top Boot 08 (US 8 - US 12)
  ((SELECT id FROM products WHERE slug = 'ld-boot-08' LIMIT 1), 'LD-BT-08-BLK-80',  'US 8',  'Matte Black', '#0D0D0D', 2, 1),
  ((SELECT id FROM products WHERE slug = 'ld-boot-08' LIMIT 1), 'LD-BT-08-BLK-90',  'US 9',  'Matte Black', '#0D0D0D', 3, 1),
  ((SELECT id FROM products WHERE slug = 'ld-boot-08' LIMIT 1), 'LD-BT-08-BLK-100', 'US 10', 'Matte Black', '#0D0D0D', 3, 1),
  ((SELECT id FROM products WHERE slug = 'ld-boot-08' LIMIT 1), 'LD-BT-08-BLK-110', 'US 11', 'Matte Black', '#0D0D0D', 2, 1),
  ((SELECT id FROM products WHERE slug = 'ld-boot-08' LIMIT 1), 'LD-BT-08-BLK-120', 'US 12', 'Matte Black', '#0D0D0D', 1, 1),

  -- Raw Carpenter Denim 09 (S, M, L, XL)
  ((SELECT id FROM products WHERE slug = 'ld-denim-09' LIMIT 1), 'LD-DN-09-IND-S',  'S',  'Raw Indigo', '#1D2939', 4, 1),
  ((SELECT id FROM products WHERE slug = 'ld-denim-09' LIMIT 1), 'LD-DN-09-IND-M',  'M',  'Raw Indigo', '#1D2939', 6, 1),
  ((SELECT id FROM products WHERE slug = 'ld-denim-09' LIMIT 1), 'LD-DN-09-IND-L',  'L',  'Raw Indigo', '#1D2939', 5, 1),
  ((SELECT id FROM products WHERE slug = 'ld-denim-09' LIMIT 1), 'LD-DN-09-IND-XL', 'XL', 'Raw Indigo', '#1D2939', 3, 1),

  -- Technical 6-Panel Cap 10 (ONE SIZE)
  ((SELECT id FROM products WHERE slug = 'ld-cap-10' LIMIT 1), 'LD-CP-10-BLK-OS', 'ONE SIZE', 'Onyx Nylon', '#121212', 25, 1)
ON DUPLICATE KEY UPDATE
  stock = VALUES(stock),
  color = VALUES(color),
  color_hex = VALUES(color_hex),
  is_active = VALUES(is_active);

-- ----------------------------------------------------------------------------
-- 4. CÓDIGOS PROMOCIONALES
-- ----------------------------------------------------------------------------
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, is_active)
VALUES
  ('FIRST15', '15% de descuento en tu primera compra (L&D Drop 04)', 'percentage', 15.00, 0.00, NULL, 1),
  ('URBAN10', '10% de descuento en indumentaria urbana', 'percentage', 10.00, 50.00, 500, 1),
  ('SNEAKER20', '$20 de descuento en compras superiores a $150', 'fixed', 20.00, 150.00, 200, 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  min_order_amount = VALUES(min_order_amount),
  is_active = VALUES(is_active);

-- ----------------------------------------------------------------------------
-- 5. USUARIOS INICIALES (Admin: Admin1234! / Cliente: Cliente1234!)
-- ----------------------------------------------------------------------------
INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active)
VALUES
  (
    'Admin',
    'L&D',
    'admin@ldstore.com',
    '$2b$10$z1TOMuLkMMg1jwltpov3k.u0Tl9O/35Op4H7lleB2FglaT90EmZyO',
    '+54 11 5555-0100',
    'admin',
    1
  ),
  (
    'Lucas',
    'Urbano',
    'cliente@ldstore.com',
    '$2b$10$ZeCDsZawmvM5laAlltICV.FhVzVRpn9no5u5cgOIv/4oqQkKfNYjS',
    '+54 11 5555-0199',
    'customer',
    1
  )
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  role = VALUES(role),
  is_active = VALUES(is_active);
