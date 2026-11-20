-- ============================================================================
-- L&D STREETWEAR & FOOTWEAR — ESQUEMA DE BASE DE DATOS MYSQL 8.0+
-- Tienda de Indumentaria Urbana y Calzado (Curso Full Stack - Fundación CILSA)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS ld_store_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ld_store_db;

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. CATEGORÍAS (Indumentaria urbana, calzado y accesorios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(60) NOT NULL,
  name VARCHAR(100) NOT NULL,
  product_type ENUM('apparel', 'footwear', 'accessory') NOT NULL DEFAULT 'apparel',
  description VARCHAR(255) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  INDEX idx_categories_type_active (product_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. PRODUCTOS (Prendas urbanas, zapatillas/botas y accesorios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  sku_prefix VARCHAR(40) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  product_type ENUM('apparel', 'footwear', 'accessory') NOT NULL DEFAULT 'apparel',
  name VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NULL,
  brand VARCHAR(80) NOT NULL DEFAULT 'L&D',
  gender ENUM('unisex', 'men', 'women') NOT NULL DEFAULT 'unisex',
  material VARCHAR(150) NULL,
  fit VARCHAR(80) NULL,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2) NULL,
  badge VARCHAR(80) NULL,
  image_url VARCHAR(500) NOT NULL,
  gallery_urls JSON NULL,
  default_size VARCHAR(20) NOT NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_sku_prefix (sku_prefix),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_type (product_type),
  INDEX idx_products_active_featured (is_active, is_featured),
  INDEX idx_products_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. VARIANTES DE PRODUCTO (Talles de indumentaria S-XL / calzado US y colores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  sku VARCHAR(60) NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'Washed Black',
  color_hex VARCHAR(7) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  price_override DECIMAL(10, 2) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variants_sku (sku),
  UNIQUE KEY uq_variants_product_size_color (product_id, size, color),
  CONSTRAINT fk_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  INDEX idx_variants_product_size (product_id, size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. USUARIOS / CLIENTES Y ADMINISTRADORES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. CÓDIGOS PROMOCIONALES (Ej: FIRST15)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  description VARCHAR(255) NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  max_uses INT UNSIGNED NULL,
  used_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promo_codes_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. ÓRDENES DE COMPRA (CHECKOUT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(30) NOT NULL,
  user_id INT UNSIGNED NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NULL,
  shipping_address VARCHAR(255) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NULL,
  promo_code_id INT UNSIGNED NULL,
  promo_code VARCHAR(40) NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('card', 'transfer', 'mercadopago', 'cash') NOT NULL DEFAULT 'card',
  status ENUM('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_promo_code
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX idx_orders_email (customer_email),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. DETALLE DE ITEMS POR ORDEN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  variant_id INT UNSIGNED NULL,
  product_name VARCHAR(150) NOT NULL,
  sku VARCHAR(60) NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. SUSCRIPTORES DEL NEWSLETTER (DROP LIST)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  source VARCHAR(60) NOT NULL DEFAULT 'web_footer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. MENSAJES DE CONTACTO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(120) NOT NULL DEFAULT 'Consulta general',
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contact_status (status),
  INDEX idx_contact_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
