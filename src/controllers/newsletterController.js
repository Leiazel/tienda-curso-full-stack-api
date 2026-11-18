import * as newsletterService from '../services/newsletterService.js';

export async function subscribe(req, res) {
  const db = req.app.locals.db;
  const result = await newsletterService.subscribeNewsletter(db, req.body);
  const statusCode = result.alreadySubscribed ? 200 : 201;

  res.status(statusCode).json({
    message: result.alreadySubscribed
      ? 'Tu email ya formaba parte de la lista de drops.'
      : `¡Bienvenido a DICH®! Usá el código "${result.promoCode}" para 15% OFF.`,
    ...result,
  });
}

export async function getSubscribers(req, res) {
  const db = req.app.locals.db;
  const items = await newsletterService.listNewsletterSubscribers(db);
  res.status(200).json({ items, total: items.length });
}

export async function unsubscribe(req, res) {
  const db = req.app.locals.db;
  const result = await newsletterService.unsubscribeNewsletter(db, req.params.email);
  res.status(200).json(result);
}
