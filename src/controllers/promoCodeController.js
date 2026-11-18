import * as promoCodeService from '../services/promoCodeService.js';

export async function getPromoCodes(req, res) {
  const db = req.app.locals.db;
  const items = await promoCodeService.listPromoCodes(db);
  res.status(200).json({ items, total: items.length });
}

export async function validatePromo(req, res) {
  const db = req.app.locals.db;
  const result = await promoCodeService.validatePromoCode(db, req.body);
  res.status(200).json(result);
}

export async function createPromo(req, res) {
  const db = req.app.locals.db;
  const promo = await promoCodeService.createPromoCode(db, req.body);
  res.status(201).json(promo);
}
