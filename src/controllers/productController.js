import * as productService from '../services/productService.js';

export async function getProducts(req, res) {
  const db = req.app.locals.db;
  const result = await productService.listProducts(db, req.query);
  res.status(200).json(result);
}

export async function getProduct(req, res) {
  const db = req.app.locals.db;
  const product = await productService.getProductByIdentifier(db, req.params.idOrSlug);
  res.status(200).json(product);
}

export async function createProduct(req, res) {
  const db = req.app.locals.db;
  const product = await productService.createProduct(db, req.body);
  res.status(201).json(product);
}

export async function updateProduct(req, res) {
  const db = req.app.locals.db;
  const product = await productService.updateProduct(db, req.params.id, req.body);
  res.status(200).json(product);
}

export async function deleteProduct(req, res) {
  const db = req.app.locals.db;
  const hard = String(req.query.hard || '').toLowerCase() === 'true';
  const result = await productService.deleteProduct(db, req.params.id, { hard });
  res.status(200).json(result);
}

export async function addVariant(req, res) {
  const db = req.app.locals.db;
  const product = await productService.addProductVariant(db, req.params.id, req.body);
  res.status(201).json(product);
}

export async function updateVariantStock(req, res) {
  const db = req.app.locals.db;
  const updated = await productService.updateVariantStock(
    db,
    req.params.id,
    req.params.variantId,
    req.body
  );
  res.status(200).json(updated);
}
