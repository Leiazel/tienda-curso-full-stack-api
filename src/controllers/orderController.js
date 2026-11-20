import * as orderService from '../services/orderService.js';

export async function createOrder(req, res) {
  const db = req.app.locals.db;
  const order = await orderService.createOrder(db, req.body, req.user || null);
  res.status(201).json(order);
}

export async function getOrders(req, res) {
  const db = req.app.locals.db;
  const result = await orderService.listOrders(db, req.query);
  res.status(200).json(result);
}

export async function getMyOrders(req, res) {
  const db = req.app.locals.db;
  const result = await orderService.listOrders(db, {
    ...req.query,
    userId: req.user.id,
  });
  res.status(200).json(result);
}

export async function getOrder(req, res) {
  const db = req.app.locals.db;
  const order = await orderService.getOrderByIdentifier(db, req.params.idOrNumber);
  res.status(200).json(order);
}

export async function updateOrderStatus(req, res) {
  const db = req.app.locals.db;
  const order = await orderService.updateOrderStatus(db, req.params.id, req.body?.status);
  res.status(200).json(order);
}
