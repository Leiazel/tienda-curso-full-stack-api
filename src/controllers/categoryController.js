import * as categoryService from '../services/categoryService.js';
import * as productService from '../services/productService.js';

export async function getCategories(req, res) {
  const db = req.app.locals.db;
  const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
  const categories = await categoryService.listCategories(db, {
    type: req.query.type,
    includeInactive,
  });

  res.status(200).json({
    items: categories,
    total: categories.length,
  });
}

export async function getCategory(req, res) {
  const db = req.app.locals.db;
  const category = await categoryService.getCategoryByIdentifier(db, req.params.idOrSlug);
  const products = await productService.listProducts(db, {
    category: category.slug,
    limit: 100,
  });

  res.status(200).json({
    ...category,
    products: products.items,
  });
}

export async function createCategory(req, res) {
  const db = req.app.locals.db;
  const category = await categoryService.createCategory(db, req.body);
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const db = req.app.locals.db;
  const category = await categoryService.updateCategory(db, req.params.id, req.body);
  res.status(200).json(category);
}

export async function deleteCategory(req, res) {
  const db = req.app.locals.db;
  const result = await categoryService.deleteCategory(db, req.params.id);
  res.status(200).json(result);
}
